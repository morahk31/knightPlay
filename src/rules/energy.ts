import { armorStatus, armorTotals, hasArmor } from './armor'
import type { Character, RulesConfig } from './types'

/** Énergie de la méta-armure : dépenses et recharges (référentiel, fiches 06 et 08). */

export interface EnergyResult {
  ok: boolean
  /** PE effectivement dépensés ou récupérés. */
  amount: number
  reason?: string
}

function energyTotal(c: Character): number {
  return hasArmor(c) ? armorTotals(c).pe : c.jauges.energie.total
}

/** Dépense de l'énergie ; refuse si l'armure est repliée ou si les PE manquent. */
export function spendEnergy(c: Character, cost: number): EnergyResult {
  const amount = Math.max(0, Math.trunc(cost))
  if (hasArmor(c) && armorStatus(c) === 'repliee') {
    return { ok: false, amount: 0, reason: 'L’armure est repliée : capacités et modules indisponibles.' }
  }
  if (c.jauges.energie.actuel < amount) {
    return { ok: false, amount: 0, reason: `Énergie insuffisante (${c.jauges.energie.actuel} PE pour ${amount} requis).` }
  }
  c.jauges.energie.actuel -= amount
  return { ok: true, amount }
}

/** Ajoute de l'énergie sans dépasser le total. */
export function gainEnergy(c: Character, amount: number): EnergyResult {
  const total = energyTotal(c)
  const before = c.jauges.energie.actuel
  c.jauges.energie.actuel = Math.min(total, before + Math.max(0, Math.trunc(amount)))
  return { ok: true, amount: c.jauges.energie.actuel - before }
}

/** Repos : +N PE par heure (fiche 06), sauf armure à énergie déficiente. */
export function restEnergy(c: Character, hours: number, rules: RulesConfig): EnergyResult {
  if (hasArmor(c) && !c.armure.rechargeRepos) {
    return { ok: false, amount: 0, reason: 'Cette armure ne recharge pas son énergie au repos (nods ou ponction).' }
  }
  return gainEnergy(c, Math.max(0, Math.trunc(hours)) * rules.armure.rechargeParHeure)
}

/** Armure repliée pendant la durée requise : énergie au maximum. */
export function foldRestEnergy(c: Character): EnergyResult {
  if (hasArmor(c) && !c.armure.rechargeRepos) {
    return { ok: false, amount: 0, reason: 'Cette armure ne recharge pas son énergie au repos (nods ou ponction).' }
  }
  return gainEnergy(c, energyTotal(c))
}

export type NodKind = 'energie' | 'armure' | 'soin'

/** Utilise un nod (+valeur lancée : 3D6 par défaut). Refuse s'il n'en reste plus. */
export function useNod(c: Character, kind: NodKind, value: number, totals: { sante: number }): EnergyResult {
  if (c.armure.nods[kind] <= 0) return { ok: false, amount: 0, reason: 'Plus de nod de ce type pour cette mission.' }
  const amount = Math.max(0, Math.trunc(value))
  c.armure.nods[kind] -= 1
  if (kind === 'energie') return gainEnergy(c, amount)
  if (kind === 'armure') {
    const max = hasArmor(c) ? armorTotals(c).pa : c.jauges.armure.total
    const before = c.jauges.armure.actuel
    c.jauges.armure.actuel = Math.min(max, before + amount)
    return { ok: true, amount: c.jauges.armure.actuel - before }
  }
  const before = c.jauges.sante.actuel
  c.jauges.sante.actuel = Math.min(totals.sante, before + amount)
  return { ok: true, amount: c.jauges.sante.actuel - before }
}

/** Début de mission : nods remis au nombre prévu. */
export function resetNods(c: Character, rules: RulesConfig): void {
  c.armure.nods = { ...rules.armure.nodsParMission }
}
