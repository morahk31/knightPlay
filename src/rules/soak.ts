import { armorStatus, effectiveCdf, hasArmor } from './armor'
import type { Character, RulesConfig } from './types'

/** Encaisser une attaque (fiche 06 « ordre d'encaissement », FAQ 2020 p. 6-10, fiche 10 pour Anathème et drain). */

export type SoakTarget = 'sante' | 'espoir' | 'energie'

export interface IncomingHit {
  degats: number
  ignoreCdf: boolean
  /** Pénétrant X : ignore X points de CdF. */
  penetrant: number
  ignoreArmure: boolean
  /** Perce armure X : si X ≥ PA restants, les PA sont ignorés. */
  perceArmure: number
  /** Plus gros bonus de CdF reçu (Shrine, impulsion…) : les bonus ne se cumulent pas. */
  bonusCdf: number
  /** Santé (normal), espoir (attaque de l'Anathème) ou énergie (drain). */
  cible: SoakTarget
}

export const NO_EFFECTS: Omit<IncomingHit, 'degats'> = {
  ignoreCdf: false,
  penetrant: 0,
  ignoreArmure: false,
  perceArmure: 0,
  bonusCdf: 0,
  cible: 'sante',
}

export interface SoakState {
  armure: number
  guardianPa: number
  sante: number
  espoir: number
  energie: number
  etat: 'deployee' | 'repliee'
}

export interface SoakResult {
  hit: IncomingHit
  /** CdF effectivement soustrait. */
  cdf: number
  /** Dégâts après le CdF. */
  apresCdf: number
  paPerdus: number
  guardianPerdus: number
  /** PS perdus par les dégâts eux-mêmes. */
  psDegats: number
  /** PS perdus par tranches de PA (−1 par tranche complète). */
  psTranches: number
  /** PS effectivement retirés (plafonnés à la santé restante). */
  psPerdus: number
  espoirPerdu: number
  energiePerdue: number
  /** L'armure se replie pendant cette attaque. */
  replie: boolean
  /** Les PA ont été ignorés (ignore armure, perce armure). */
  paIgnores: boolean
  agonie: boolean
  before: SoakState
  after: SoakState
  /** Détail lisible, dans l'ordre du pipeline. */
  etapes: string[]
}

function int(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0
}

export function soakState(c: Character): SoakState {
  return {
    armure: c.jauges.armure.actuel,
    guardianPa: c.armure.guardianPa,
    sante: c.jauges.sante.actuel,
    espoir: c.jauges.espoir.actuel,
    energie: c.jauges.energie.actuel,
    etat: c.armure.etat,
  }
}

function hasAdvantage(c: Character, name: string): boolean {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase().trim()
  return c.avantages.some((a) => norm(a) === norm(name))
}

/** Répartition d'une attaque reçue, sans modifier le personnage. */
export function soak(c: Character, raw: IncomingHit, rules: RulesConfig): SoakResult {
  const hit: IncomingHit = {
    ...raw,
    degats: int(raw.degats),
    penetrant: int(raw.penetrant),
    perceArmure: int(raw.perceArmure),
    bonusCdf: int(raw.bonusCdf),
  }
  const before = soakState(c)
  const after: SoakState = { ...before }
  const etapes: string[] = []
  const armored = hasArmor(c)
  const status = armorStatus(c)
  const gen4 = armored && c.armure.generation === 4
  const folded = status === 'repliee'

  // 1. Champ de force (armure, Guardian si repliée) + le plus gros bonus ; pénétrant, ignore CdF.
  const cdfBase = effectiveCdf(c, rules) + hit.bonusCdf
  const cdf = hit.ignoreCdf ? 0 : Math.max(0, cdfBase - hit.penetrant)
  const apresCdf = Math.max(0, hit.degats - cdf)
  if (hit.ignoreCdf) etapes.push(`CdF ignoré`)
  else if (cdfBase) etapes.push(`CdF −${Math.min(cdf, hit.degats)}${hit.penetrant ? ` (${cdfBase} − pénétrant ${hit.penetrant})` : ''}`)
  etapes.push(`${apresCdf} dégât${apresCdf > 1 ? 's' : ''} après CdF`)

  const result: SoakResult = {
    hit, cdf, apresCdf, paPerdus: 0, guardianPerdus: 0, psDegats: 0, psTranches: 0, psPerdus: 0,
    espoirPerdu: 0, energiePerdue: 0, replie: false, paIgnores: false, agonie: false, before, after, etapes,
  }

  // 2. Anathème (espoir) et drain (énergie) : le CdF protège, pas les PA.
  if (hit.cible === 'espoir') {
    const reduction = hasAdvantage(c, 'Esprit d’acier') ? 1 : 0
    result.espoirPerdu = Math.min(before.espoir, Math.max(0, apresCdf - (apresCdf > 0 ? reduction : 0)))
    after.espoir = before.espoir - result.espoirPerdu
    etapes.push(`Espoir −${result.espoirPerdu}${reduction && apresCdf > 0 ? ' (Esprit d’acier −1)' : ''}`)
    return result
  }
  if (hit.cible === 'energie') {
    result.energiePerdue = Math.min(before.energie, apresCdf)
    after.energie = before.energie - result.energiePerdue
    etapes.push(`Énergie −${result.energiePerdue}`)
    return result
  }

  // 3. Points d'armure (méta-armure ou Guardian), sauf ignore armure / perce armure.
  let reste = apresCdf
  const paCibles = folded ? before.guardianPa : before.armure
  const bypass = !gen4 && (hit.ignoreArmure || (hit.perceArmure > 0 && hit.perceArmure >= paCibles))
  if (bypass && reste > 0) {
    result.paIgnores = true
    etapes.push(hit.ignoreArmure ? 'Ignore armure : PA ignorés' : `Perce armure ${hit.perceArmure} ≥ ${paCibles} PA : PA ignorés`)
  } else if (folded) {
    result.guardianPerdus = Math.min(reste, before.guardianPa)
    reste -= result.guardianPerdus
    after.guardianPa -= result.guardianPerdus
    if (result.guardianPerdus) etapes.push(`Guardian −${result.guardianPerdus} PA`)
  } else {
    result.paPerdus = Math.min(reste, before.armure)
    reste -= result.paPerdus
    after.armure -= result.paPerdus
    if (result.paPerdus) etapes.push(`PA −${result.paPerdus}`)
    const sansTranche = gen4 || hasAdvantage(c, 'Infatigable')
    if (!sansTranche && rules.encaissement.tranchePa > 0) {
      result.psTranches = Math.floor(result.paPerdus / rules.encaissement.tranchePa)
      if (result.psTranches) etapes.push(`−${result.psTranches} PS (tranches de ${rules.encaissement.tranchePa} PA)`)
    }
    if (armored && after.armure === 0 && (result.paPerdus > 0 || reste > 0)) {
      result.replie = true
      after.etat = 'repliee'
      etapes.push(gen4 ? 'PA à 0 : agonie (4ᵉ génération)' : 'PA à 0 : l’armure se replie')
    }
    if (reste > 0 && armored && !gen4 && rules.encaissement.excedentApresPa === 'guardian') {
      result.guardianPerdus = Math.min(reste, before.guardianPa)
      reste -= result.guardianPerdus
      after.guardianPa -= result.guardianPerdus
      if (result.guardianPerdus) etapes.push(`Guardian −${result.guardianPerdus} PA (sans son CdF)`)
    }
  }

  // 4. Points de santé (absents en 4ᵉ génération).
  if (gen4) {
    if (reste > 0) etapes.push(`${reste} dégât${reste > 1 ? 's' : ''} sans effet (pas de PS)`)
    result.agonie = result.replie
    return result
  }
  result.psDegats = reste
  const totalPs = reste + result.psTranches
  result.psPerdus = Math.min(before.sante, totalPs)
  after.sante = before.sante - result.psPerdus
  if (reste) etapes.push(`PS −${reste}`)
  result.agonie = after.sante === 0 && result.psPerdus > 0
  if (result.agonie) etapes.push('PS à 0 : agonie')
  return result
}

/** Applique une répartition calculée par `soak`. */
export function applySoak(c: Character, result: SoakResult): void {
  restoreSoakState(c, result.after)
}

export function restoreSoakState(c: Character, state: SoakState): void {
  c.jauges.armure.actuel = state.armure
  c.armure.guardianPa = state.guardianPa
  c.jauges.sante.actuel = state.sante
  c.jauges.espoir.actuel = state.espoir
  c.jauges.energie.actuel = state.energie
  c.armure.etat = state.etat
}

/** Résumé pour le journal. */
export function describeSoak(result: SoakResult): string {
  return `${result.hit.degats} dégâts : ${result.etapes.join(' → ')}`
}
