import { NO_ARMOR, aspectOf, emptySlots, noArmor } from './catalog'

export { NO_ARMOR, noArmor }
import type {
  ArmorDef,
  ArmorState,
  CaracId,
  Character,
  InstalledModule,
  ModuleDef,
  RulesConfig,
  SlotZone,
  Slots,
} from './types'

/** Méta-armure, modules et overdrives effectifs (référentiel, fiches 06 et 09). */

export const SLOT_ZONES: readonly SlotZone[] = ['tete', 'brasG', 'brasD', 'torse', 'jambeG', 'jambeD']

export const SLOT_LABELS: Record<SlotZone, string> = {
  tete: 'Tête',
  brasG: 'Bras G',
  brasD: 'Bras D',
  torse: 'Torse',
  jambeG: 'Jambe G',
  jambeD: 'Jambe D',
}

export const CUSTOM_ARMOR = 'personnalisee'

/** Copie modifiable d'un modèle du catalogue. */
export function armorFromDef(def: ArmorDef, rules: RulesConfig): ArmorState {
  return {
    ...noArmor(rules),
    modele: def.id,
    nom: def.nom,
    generation: def.generation,
    pa: def.pa,
    pe: def.pe,
    cdf: def.cdf,
    od: { ...def.od },
    slots: { ...def.slots },
    capacites: def.capacites.map((c) =>
      c.id === 'borealis-attaque' ? { ...c, cout: rules.armure.borealisPlasmaPe } : { ...c },
    ),
    evolutions: def.evolutions.map((e) => ({ ...e })),
    aVerifier: def.aVerifier,
    notes: def.notes ?? '',
    rechargeRepos: def.rechargeRepos ?? true,
  }
}

/** Copie modifiable d'un module du catalogue, au niveau voulu. */
export function moduleFromDef(def: ModuleDef, niveau: number, uid: string): InstalledModule {
  const level = Math.min(Math.max(1, Math.trunc(niveau)), def.niveaux.length)
  const effetNiveau = def.niveaux[level - 1]?.effet
  return {
    uid,
    moduleId: def.id,
    nom: def.nom,
    niveau: level,
    slots: { ...def.slots },
    energie: def.energie,
    activation: def.activation,
    duree: def.duree,
    effet: effetNiveau && level > 1 ? `${def.effet} Niveau ${level} : ${effetNiveau}` : def.effet,
    ...(def.permanent ? { permanent: { ...def.permanent } } : {}),
  }
}

export function hasArmor(c: Character): boolean {
  return c.armure.modele !== NO_ARMOR
}

/** Bonus permanents des modules installés (améliorations), cumulés par niveau. */
export function moduleBonuses(c: Character): { pa: number; pe: number; cdf: number; slots: number } {
  return c.modules.reduce(
    (acc, m) => {
      const p = m.permanent
      if (!p) return acc
      return {
        pa: acc.pa + (p.pa ?? 0) * m.niveau,
        pe: acc.pe + (p.pe ?? 0) * m.niveau,
        cdf: acc.cdf + (p.cdf ?? 0) * m.niveau,
        slots: acc.slots + (p.slots ?? 0) * m.niveau,
      }
    },
    { pa: 0, pe: 0, cdf: 0, slots: 0 },
  )
}

export interface ArmorTotals {
  pa: number
  pe: number
  cdf: number
  slots: Slots
}

/** Totaux effectifs : armure + améliorations permanentes. */
export function armorTotals(c: Character): ArmorTotals {
  const bonus = moduleBonuses(c)
  const slots = emptySlots()
  for (const zone of SLOT_ZONES) slots[zone] = c.armure.slots[zone] + bonus.slots
  return { pa: c.armure.pa + bonus.pa, pe: c.armure.pe + bonus.pe, cdf: c.armure.cdf + bonus.cdf, slots }
}

export type ArmorStatus = 'aucune' | 'deployee' | 'repliee'

/** Déployée, repliée (volontairement ou à 0 PA), ou pas d'armure. */
export function armorStatus(c: Character): ArmorStatus {
  if (!hasArmor(c)) return 'aucune'
  if (c.armure.etat === 'repliee' || c.jauges.armure.actuel <= 0) return 'repliee'
  return 'deployee'
}

/** Champ de force effectif : celui de l'armure déployée, sinon celui de la combinaison Guardian. */
export function effectiveCdf(c: Character, rules: RulesConfig): number {
  const status = armorStatus(c)
  if (status === 'deployee') return armorTotals(c).cdf
  if (status === 'repliee') return rules.armure.guardianCdf
  return 0
}

/** Les modules et OD de l'armure sont-ils utilisables ? (armure déployée et énergie disponible) */
export function armorSystemsOnline(c: Character, rules: RulesConfig): boolean {
  if (!hasArmor(c)) return true
  if (armorStatus(c) !== 'deployee') return false
  return rules.armure.odSansEnergie || c.jauges.energie.actuel > 0
}

/** OD apportés par le type actif de la Warrior (1, ou 2 à 250 PG totaux). */
function warriorTypeBonus(c: Character, carac: CaracId): number {
  const type = c.armure.warriorType
  if (c.armure.modele !== 'warrior' || !type || aspectOf(carac) !== type) return 0
  return c.progression.pgTotal >= 250 ? 2 : 1
}

/**
 * Niveau d'overdrive effectif d'une caractéristique :
 * OD achetés (fiche) + OD de base de l'armure + type Warrior actif.
 * Sans armure choisie, seuls les OD saisis sur la fiche comptent.
 * Armure repliée ou à 0 PE : aucun OD (LdB p. 130-131).
 */
export function effectiveOd(c: Character, carac: CaracId, rules: RulesConfig): number {
  const achetes = c.caracs[carac].od
  if (!hasArmor(c)) return achetes
  if (!armorSystemsOnline(c, rules)) return 0
  return achetes + (c.armure.od[carac] ?? 0) + warriorTypeBonus(c, carac)
}

export interface SlotUsage {
  used: number
  max: number
  over: boolean
}

/** Occupation des slots par zone. */
export function slotUsage(c: Character): Record<SlotZone, SlotUsage> {
  const totals = armorTotals(c).slots
  const usage = {} as Record<SlotZone, SlotUsage>
  for (const zone of SLOT_ZONES) {
    const used = c.modules.reduce((sum, m) => sum + (m.slots[zone] ?? 0), 0)
    usage[zone] = { used, max: totals[zone], over: used > totals[zone] }
  }
  return usage
}

/** Zones où l'ajout d'un module dépasserait les slots disponibles. */
export function slotOverflow(c: Character, slots: Partial<Slots>): SlotZone[] {
  const usage = slotUsage(c)
  return SLOT_ZONES.filter((zone) => (slots[zone] ?? 0) > 0 && usage[zone].used + (slots[zone] ?? 0) > usage[zone].max)
}

/** Évolutions débloquées par le total de PG (hors évolutions achetées). */
export function isEvolutionUnlocked(c: Character, pg: number, achetee?: boolean): boolean {
  return !achetee && c.progression.pgTotal >= pg
}
