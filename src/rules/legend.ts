import { LEGEND_BASES, findChassis } from '../data/legend'
import { parseEffects } from './effects'
import type { CheckReason, UpgradeCheck } from './progression'
import { palierAtteint } from './progression'
import type { Character, LegendChassis, LegendOptimisation, LegendState, Portee, RulesConfig, WeaponProfile } from './types'

/** Arsenal de légende : arbres d'optimisations (Arsenal de légende p. 4-6). */

export const ROOT = 'racine'
const PORTEES: Portee[] = ['contact', 'courte', 'moyenne', 'longue', 'lointaine']

/** Voisinage symétrique de l'arbre (optimisations, `racine` et lignes `bus:…`). */
export function adjacency(chassis: LegendChassis): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set())
    if (!adj.has(b)) adj.set(b, new Set())
    adj.get(a)!.add(b)
    adj.get(b)!.add(a)
  }
  for (const opt of chassis.optimisations) {
    if (!adj.has(opt.id)) adj.set(opt.id, new Set())
    for (const l of opt.liens) link(opt.id, l)
  }
  return adj
}

export function boughtCount(state: LegendState, id: string): number {
  return Math.max(0, Math.trunc(state.achats[id] ?? 0))
}

/**
 * Optimisations reliées : voisines du châssis, d'une optimisation achetée,
 * ou d'une ligne commune atteinte (« dès qu'une optimisation est prise, toutes les optimisations liées deviennent disponibles »).
 */
export function linkedOptimisations(chassis: LegendChassis, state: LegendState): Set<string> {
  const adj = adjacency(chassis)
  const reached = new Set<string>([ROOT])
  for (const opt of chassis.optimisations) if (boughtCount(state, opt.id) > 0) reached.add(opt.id)
  // Les lignes communes (`bus:…`) relaient la connexion.
  let changed = true
  while (changed) {
    changed = false
    for (const [node, neighbours] of adj) {
      if (!node.startsWith('bus:') || reached.has(node)) continue
      if ([...neighbours].some((n) => reached.has(n))) {
        reached.add(node)
        changed = true
      }
    }
  }
  const linked = new Set<string>()
  for (const opt of chassis.optimisations) {
    if ([...(adj.get(opt.id) ?? [])].some((n) => reached.has(n))) linked.add(opt.id)
  }
  return linked
}

export type OptimisationEtat = 'complete' | 'disponible' | 'non-reliee' | 'rarete'

export function optimisationEtat(c: Character, chassis: LegendChassis, state: LegendState, opt: LegendOptimisation, rules: RulesConfig): OptimisationEtat {
  if (boughtCount(state, opt.id) >= opt.couts.length) return 'complete'
  if (palierAtteint(c, opt.rarete, rules) !== null) return 'rarete'
  return linkedOptimisations(chassis, state).has(opt.id) ? 'disponible' : 'non-reliee'
}

function check(libelle: string, cout: number, raisons: CheckReason[]): UpgradeCheck {
  return {
    libelle, cout, devise: 'PG', de: 0, vers: 1, raisons,
    ok: raisons.length === 0,
    forcable: raisons.length > 0 && raisons.every((r) => !r.bloquant),
  }
}

/** Contrôle d'achat d'une optimisation : achats restants, rareté, lien, solde. */
export function checkOptimisation(c: Character, chassis: LegendChassis, state: LegendState, opt: LegendOptimisation, rules: RulesConfig): UpgradeCheck {
  const n = boughtCount(state, opt.id)
  const cout = opt.couts[n] ?? 0
  const raisons: CheckReason[] = []
  if (n >= opt.couts.length) raisons.push({ texte: 'Déjà achetée', bloquant: true })
  const requis = palierAtteint(c, opt.rarete, rules)
  if (requis !== null) raisons.push({ texte: `Rareté : ${requis} PG gagnés requis`, bloquant: false })
  if (!linkedOptimisations(chassis, state).has(opt.id)) raisons.push({ texte: 'Pas reliée à une optimisation achetée', bloquant: false })
  if (c.progression.pgSolde < cout) raisons.push({ texte: `PG insuffisants (${c.progression.pgSolde} pour ${cout})`, bloquant: true })
  const suffixe = opt.couts.length > 1 ? ` (${n + 1}/${opt.couts.length})` : ''
  return check(`${chassis.nom} : ${opt.nom}${suffixe}`, cout, raisons)
}

/** Achat d'un châssis : un seul par arme, coût en PG. */
export function checkChassis(c: Character, state: LegendState, chassis: LegendChassis): UpgradeCheck {
  const raisons: CheckReason[] = []
  if (state.chassisId) raisons.push({ texte: 'Cette arme a déjà un châssis (il ne peut pas être changé)', bloquant: true })
  if (chassis.base !== state.base) raisons.push({ texte: 'Châssis incompatible avec cette arme', bloquant: true })
  if (c.progression.pgSolde < chassis.pg) raisons.push({ texte: `PG insuffisants (${c.progression.pgSolde} pour ${chassis.pg})`, bloquant: true })
  return check(chassis.nom, chassis.pg, raisons)
}

/** Profil optimisé : profil du châssis + bonus et effets des optimisations achetées. */
export function legendProfile(chassis: LegendChassis, state: LegendState): WeaponProfile {
  const p: WeaponProfile = JSON.parse(JSON.stringify(chassis.profil))
  for (const opt of chassis.optimisations) {
    const n = Math.min(boughtCount(state, opt.id), opt.couts.length)
    if (!n) continue
    const b = opt.bonus
    if (b) {
      p.degats.des += (b.degatsDes ?? 0) * n
      p.degats.fixe += (b.degatsFixe ?? 0) * n
      p.violence.des += (b.violenceDes ?? 0) * n
      p.violence.fixe += (b.violenceFixe ?? 0) * n
    }
    if (opt.retire) p.effets = p.effets.filter((e) => !opt.retire!.includes(e.id))
    if (opt.effet) {
      const ajout = parseEffects(opt.effet)
      const remplaces = new Set([...(opt.remplace ? [opt.remplace] : []), ...ajout.map((e) => e.id)])
      p.effets = [...p.effets.filter((e) => !remplaces.has(e.id) || e.id === 'autre'), ...ajout]
    }
    if (opt.portee && PORTEES.indexOf(opt.portee) > PORTEES.indexOf(p.portee)) p.portee = opt.portee
  }
  return p
}

/** Profils d'une arme de légende : forme de base (pistolet, lame) puis forme optimisée. */
export function legendProfiles(state: LegendState): WeaponProfile[] {
  const chassis = findChassis(state.chassisId)
  const profiles: WeaponProfile[] = []
  if (state.base !== 'longbow') profiles.push(JSON.parse(JSON.stringify(LEGEND_BASES[state.base].profil)))
  if (chassis) profiles.push(legendProfile(chassis, state))
  return profiles
}

/** PG investis dans l'arme (châssis + optimisations). */
export function legendInvestment(state: LegendState): number {
  const chassis = findChassis(state.chassisId)
  if (!chassis) return 0
  return chassis.optimisations.reduce(
    (sum, opt) => sum + opt.couts.slice(0, boughtCount(state, opt.id)).reduce((a, b) => a + b, 0),
    chassis.pg,
  )
}
