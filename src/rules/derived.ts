import { ASPECTS, CARAC_LABELS, DERIVED_ASPECT, GAUGE_IDS } from './catalog'
import type {
  AspectId,
  CaracId,
  Character,
  DerivedId,
  GaugeId,
  RulesConfig,
  SourcedDerivedId,
} from './types'

export interface DerivedValue {
  /** Valeur effective (calculée, ou imposée si `manual`). */
  value: number
  /** Valeur issue de la formule. */
  computed: number
  /** Vrai si la valeur est imposée manuellement. */
  manual: boolean
  /** Caractéristique source retenue (valeurs à caractéristique uniquement). */
  source?: CaracId
}

export type DerivedValues = Record<DerivedId, DerivedValue>

/** Les OD comptent-ils pour cette valeur dérivée ? (fiche 02, étape 9) */
function usesOd(id: SourcedDerivedId, rules: RulesConfig): boolean {
  if (id === 'santeMax' || id === 'contactsMax') return false
  return rules.derivees.odDansDefenseReactionInitiative
}

function caracScore(c: Character, carac: CaracId, withOd: boolean): number {
  const { val, od } = c.caracs[carac]
  return val + (withOd ? od : 0)
}

/** Caractéristique source : celle choisie, ou la meilleure de l'aspect si `auto`. */
export function resolveSource(c: Character, id: SourcedDerivedId, rules: RulesConfig): CaracId {
  const chosen = c.derivedSource[id]
  const aspect = DERIVED_ASPECT[id]
  const candidates = ASPECTS.find((a) => a.id === aspect)!.caracs
  if (chosen !== 'auto' && candidates.includes(chosen)) return chosen
  const withOd = usesOd(id, rules)
  return candidates.reduce((best, carac) =>
    caracScore(c, carac, withOd) > caracScore(c, best, withOd) ? carac : best,
  )
}

function computeSourced(c: Character, id: SourcedDerivedId, rules: RulesConfig): { computed: number; source: CaracId } {
  const source = resolveSource(c, id, rules)
  const score = caracScore(c, source, usesOd(id, rules))
  const computed =
    id === 'santeMax'
      ? rules.derivees.santeBase + rules.derivees.santeParPoint * score + c.bonus.sante
      : score
  return { computed, source }
}

function finalize(c: Character, id: DerivedId, computed: number, source?: CaracId): DerivedValue {
  const override = c.overrides[id]
  const manual = typeof override === 'number'
  return { value: manual ? override : computed, computed, manual, ...(source ? { source } : {}) }
}

/** Calcule toutes les valeurs dérivées du personnage. */
export function computeDerived(c: Character, rules: RulesConfig): DerivedValues {
  const sourced = (id: SourcedDerivedId) => {
    const { computed, source } = computeSourced(c, id, rules)
    return finalize(c, id, computed, source)
  }
  return {
    defense: sourced('defense'),
    reaction: sourced('reaction'),
    initiative: sourced('initiative'),
    santeMax: sourced('santeMax'),
    contactsMax: sourced('contactsMax'),
    espoirMax: finalize(c, 'espoirMax', rules.derivees.espoirBase + c.bonus.espoir),
  }
}

/** Total effectif de chaque jauge. */
export function gaugeTotals(c: Character, rules: RulesConfig): Record<GaugeId, number> {
  const d = computeDerived(c, rules)
  return {
    sante: d.santeMax.value,
    armure: c.jauges.armure.total,
    energie: c.jauges.energie.total,
    espoir: d.espoirMax.value,
    heroisme: rules.derivees.heroismeMax,
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/** Ramène chaque jauge actuelle entre 0 et son total effectif. */
export function clampGauges(c: Character, rules: RulesConfig): void {
  const totals = gaugeTotals(c, rules)
  for (const id of GAUGE_IDS) {
    c.jauges[id].actuel = clamp(c.jauges[id].actuel, 0, totals[id])
  }
}

export interface SheetWarning {
  kind: 'carac-above-aspect' | 'aspect-above-max'
  target: AspectId | CaracId
  message: string
}

/** Plafond effectif d'un aspect (maximum général et inconvénients présents). */
export function aspectCap(c: Character, aspect: AspectId, rules: RulesConfig): number {
  return rules.limites.aspectCaps
    .filter(
      (cap) =>
        (cap.aspect === 'all' || cap.aspect === aspect) &&
        c.inconvenients.some((i) => i.trim().toLowerCase() === cap.inconvenient.toLowerCase()),
    )
    .reduce((max, cap) => Math.min(max, cap.max), rules.limites.aspectMax)
}

/** Avertissements non bloquants sur la cohérence de la fiche. */
export function sheetWarnings(c: Character, rules: RulesConfig): SheetWarning[] {
  const warnings: SheetWarning[] = []
  for (const aspect of ASPECTS) {
    const score = c.aspects[aspect.id]
    const cap = aspectCap(c, aspect.id, rules)
    if (score > cap) {
      warnings.push({
        kind: 'aspect-above-max',
        target: aspect.id,
        message: `${aspect.nom} (${score}) dépasse son maximum (${cap}).`,
      })
    }
    for (const carac of aspect.caracs) {
      const val = c.caracs[carac].val
      if (val > score) {
        warnings.push({
          kind: 'carac-above-aspect',
          target: carac,
          message: `${CARAC_LABELS[carac]} (${val}) dépasse l’aspect ${aspect.nom} (${score}).`,
        })
      }
    }
  }
  return warnings
}
