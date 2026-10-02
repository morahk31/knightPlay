import { ASPECTS, CARAC_LABELS, aspectOf } from './catalog'
import { aspectCap } from './derived'
import type { AspectId, CaracId, Character, Disponibilite, RulesConfig } from './types'

/** Progression entre les missions : gains et coûts (fiche 07, OD : fiche 09). */

export interface MissionInput {
  objectifAtteint: boolean
  secondaires: number
  /** Nombre total de parties jouées pour cette mission. */
  parties: number
  /** Modes héroïques activés par le personnage. */
  heroiques: number
  /** PG de l'objectif principal (10 à 20 selon la difficulté). */
  pgObjectif: number
}

function int(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0
}

/** PX et PG proposés en fin de mission (LdB p. 107). */
export function missionGains(input: MissionInput, rules: RulesConfig): { px: number; pg: number } {
  const r = rules.progression
  const secondaires = int(input.secondaires)
  const px =
    r.pxFinMission +
    (input.objectifAtteint ? r.pxObjectif : 0) +
    Math.max(0, int(input.parties) - 1) * r.pxPartieSup +
    secondaires * r.pxSecondaire
  const pgObjectif = Math.min(r.pgObjectifMax, Math.max(r.pgObjectifMin, int(input.pgObjectif)))
  const pg =
    (input.objectifAtteint ? pgObjectif : 0) + secondaires * r.pgSecondaire + int(input.heroiques) * r.pgHeroique
  return { px, pg }
}

export interface CheckReason {
  texte: string
  /** Une raison bloquante ne peut pas être outrepassée (solde insuffisant). */
  bloquant: boolean
}

export interface UpgradeCheck {
  libelle: string
  cout: number
  devise: 'PX' | 'PG'
  /** Valeurs avant et après. */
  de: number
  vers: number
  raisons: CheckReason[]
  ok: boolean
  /** Possible en passant outre les raisons non bloquantes. */
  forcable: boolean
}

function check(libelle: string, cout: number, devise: 'PX' | 'PG', de: number, vers: number, raisons: CheckReason[]): UpgradeCheck {
  return {
    libelle,
    cout,
    devise,
    de,
    vers,
    raisons,
    ok: raisons.length === 0,
    forcable: raisons.length > 0 && raisons.every((r) => !r.bloquant),
  }
}

function soldeReason(c: Character, cout: number, devise: 'PX' | 'PG'): CheckReason | null {
  const solde = devise === 'PX' ? c.progression.pxActuel : c.progression.pgSolde
  return solde < cout ? { texte: `${devise} insuffisants (${solde} pour ${cout})`, bloquant: true } : null
}

function aspectName(aspect: AspectId): string {
  return ASPECTS.find((a) => a.id === aspect)!.nom
}

/** Aspect +1 : nouveau score × 5 PX, une fois par mission, plafond (LdB p. 108, p. 79). */
export function checkAspect(c: Character, aspect: AspectId, rules: RulesConfig): UpgradeCheck {
  const de = c.aspects[aspect]
  const vers = de + 1
  const cout = vers * rules.progression.coutAspect
  const raisons: CheckReason[] = []
  const max = aspectCap(c, aspect, rules)
  if (vers > max) raisons.push({ texte: `Dépasse le maximum de l’aspect (${max})`, bloquant: false })
  if (c.progression.aspectsMission.includes(aspect)) {
    raisons.push({ texte: 'Un aspect ne monte qu’une fois par mission', bloquant: false })
  }
  const solde = soldeReason(c, cout, 'PX')
  if (solde) raisons.push(solde)
  return check(aspectName(aspect), cout, 'PX', de, vers, raisons)
}

/** Caractéristique +1 : nouveau score × 2 PX, sans dépasser l'aspect (LdB p. 108). */
export function checkCarac(c: Character, carac: CaracId, rules: RulesConfig): UpgradeCheck {
  const de = c.caracs[carac].val
  const vers = de + 1
  const cout = vers * rules.progression.coutCarac
  const raisons: CheckReason[] = []
  const aspect = aspectOf(carac)
  if (vers > c.aspects[aspect]) {
    raisons.push({ texte: `Dépasse l’aspect ${aspectName(aspect)} (${c.aspects[aspect]})`, bloquant: false })
  }
  const solde = soldeReason(c, cout, 'PX')
  if (solde) raisons.push(solde)
  return check(CARAC_LABELS[carac], cout, 'PX', de, vers, raisons)
}

/** Niveau d'OD actuel : OD de base de l'armure + OD achetés. */
export function odLevel(c: Character, carac: CaracId): number {
  const base = c.armure.modele === 'aucune' ? 0 : (c.armure.od[carac] ?? 0)
  return base + c.caracs[carac].od
}

/** Disponibilité atteinte par le total de PG. */
export function palierAtteint(c: Character, dispo: Disponibilite, rules: RulesConfig): number | null {
  if (dispo === 'standard') return null
  const requis = rules.progression.paliers[dispo]
  return c.progression.pgTotal >= requis ? null : requis
}

/** OD +1 : 10 / 30 / 50 / 70 / 100 PG ; au-delà du niveau 2, rare (300 PG gagnés). */
export function checkOd(c: Character, carac: CaracId, rules: RulesConfig): UpgradeCheck {
  const r = rules.progression
  const de = odLevel(c, carac)
  const vers = de + 1
  const cout = r.coutOd[vers - 1] ?? r.coutOd[r.coutOd.length - 1] ?? 0
  const raisons: CheckReason[] = []
  if (vers > r.odMax) raisons.push({ texte: `Niveau maximum ${r.odMax} (sauf Warrior)`, bloquant: false })
  if (vers >= r.odNiveauRare) {
    const requis = palierAtteint(c, 'rare', rules)
    if (requis !== null) raisons.push({ texte: `Niveau ${vers} : rare, ${requis} PG gagnés requis`, bloquant: false })
  }
  const solde = soldeReason(c, cout, 'PG')
  if (solde) raisons.push(solde)
  return check(`OD de ${CARAC_LABELS[carac]}`, cout, 'PG', de, vers, raisons)
}

const DISPO_LABEL: Record<Disponibilite, string> = { standard: 'standard', avance: 'avancé', rare: 'rare', prestige: 'prestige' }

/** Achat en PG (module, arme, implant…) : palier de disponibilité et solde. */
export function checkPurchase(
  c: Character,
  libelle: string,
  cout: number,
  dispo: Disponibilite,
  rules: RulesConfig,
): UpgradeCheck {
  const raisons: CheckReason[] = []
  const requis = palierAtteint(c, dispo, rules)
  if (requis !== null) raisons.push({ texte: `Équipement ${DISPO_LABEL[dispo]} : ${requis} PG gagnés requis`, bloquant: false })
  const solde = soldeReason(c, int(cout), 'PG')
  if (solde) raisons.push(solde)
  return check(libelle, int(cout), 'PG', 0, 1, raisons)
}

/** Libellé d'une raison de refus, pour l'interface. */
export function refusalText(check: UpgradeCheck): string {
  return check.raisons.map((r) => r.texte).join(' ; ')
}

/** Statut de renommée selon le total de PG (LdB p. 102, 108). */
export function renommee(c: Character, rules: RulesConfig): string {
  const { paliers } = rules.progression
  const pg = c.progression.pgTotal
  if (pg >= paliers.prestige) return 'Chevalier de la Table Ronde'
  if (pg >= paliers.rare) return 'Célèbre jusque dans les arches'
  if (pg >= paliers.avance) return 'Remarqué par la Table Ronde'
  return 'Chevalier récent'
}
