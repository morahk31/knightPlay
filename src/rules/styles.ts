import { computeDerived } from './derived'
import { effectValue, hasEffect } from './effects'
import type { Character, EffectRef, RulesConfig, StyleId } from './types'

/** Styles de combat (fiche 03, LdB p. 88-89 ; 4 styles du livret 2020, fiche 13). */
export interface StyleDef {
  id: StyleId
  nom: string
  /** Dés ajoutés (+) ou retirés (−) aux attaques. */
  desAttaque: number
  defense: number
  reaction: number
  /** Arme requise, en clair. */
  requis?: string
  description: string
}

export const STYLES: readonly StyleDef[] = [
  { id: 'standard', nom: 'Standard', desAttaque: 0, defense: 0, reaction: 0, description: 'Ni bonus ni malus.' },
  { id: 'agressif', nom: 'Agressif', desAttaque: 3, defense: -2, reaction: -2, description: '+3 dés aux attaques, −2 en défense et en réaction.' },
  { id: 'defensif', nom: 'Défensif', desAttaque: -3, defense: 2, reaction: 0, description: '+2 en défense, −3 dés aux attaques.' },
  { id: 'couvert', nom: 'Mise à couvert', desAttaque: -3, defense: 0, reaction: 2, description: '+2 en réaction (abri dans la ligne de tir), −3 dés aux attaques.' },
  { id: 'ambidextre', nom: 'Ambidextre', desAttaque: -3, defense: 0, reaction: 0, requis: 'Deux armes à une main',
    description: 'Deux attaques (une par main) pour une action de combat, à −3 dés chacune (−1 avec jumelé).' },
  { id: 'akimbo', nom: 'Akimbo', desAttaque: -3, defense: 0, reaction: 0, requis: 'Deux armes identiques à une main',
    description: 'Un seul jet : dés de dégâts des deux armes, violence d’une arme + moitié de l’autre. −3 dés (−1 avec jumelé).' },
  { id: 'precis', nom: 'Précis', desAttaque: 0, defense: 0, reaction: 0, requis: 'Arme de contact à deux mains',
    description: '+1 caractéristique en combo (Dextérité, Savoir, Instinct ou Sang-froid, sans leurs OD) ; l’attaque coûte aussi une action de déplacement.' },
  { id: 'pilonnage', nom: 'Pilonnage', desAttaque: -2, defense: 0, reaction: 0, requis: 'Arme de tir à deux mains',
    description: '+1 dé de dégâts ou de violence par tour passé à tirer sur la même cible (6 max), −2 dés à l’attaque.' },
  { id: 'puissant', nom: 'Puissant', desAttaque: 0, defense: -2, reaction: -2, requis: 'Arme de contact lourde',
    description: 'Échange des dés d’attaque contre autant de dés de dégâts ou de violence (6 max), −2 en défense et en réaction.' },
  { id: 'suppression', nom: 'Suppression', desAttaque: 0, defense: 0, reaction: 0, requis: 'Arme de tir lourde',
    description: '2 dés de dégâts sacrifiés = −1 dé aux dégâts de l’ennemi (−3 max) ; contre une bande, 2 dés de violence = −1 au débordement (−4 max).' },
]

export function findStyle(id: StyleId): StyleDef {
  return STYLES.find((s) => s.id === id) ?? STYLES[0]!
}

/** Styles qui transfèrent des dés vers les dégâts ou la violence (6 au maximum). */
export function styleTransfersDice(id: StyleId): boolean {
  return id === 'pilonnage' || id === 'puissant'
}

/**
 * Dés ajoutés ou retirés à l'attaque par le style.
 * `transfert` = dés échangés (puissant) ; les effets jumelé et l'amélioration « protectrice » réduisent le malus.
 */
export function styleAttackDice(
  id: StyleId,
  effets: readonly EffectRef[],
  ameliorations: readonly string[] = [],
  transfert = 0,
): number {
  if (id === 'akimbo' && hasEffect(effets, 'jumele-akimbo')) return -1
  if (id === 'ambidextre' && hasEffect(effets, 'jumele-ambidextrie')) return -1
  if (id === 'defensif' && ameliorations.includes('protectrice')) return -1
  if (id === 'puissant') return -Math.min(6, Math.max(0, Math.trunc(transfert)))
  return findStyle(id).desAttaque
}

/** Défense et réaction en combat : valeurs de la fiche + style + défense X / réaction X de l'arme tenue. */
export function combatDefenses(
  c: Character,
  rules: RulesConfig,
  effets: readonly EffectRef[] = [],
): { defense: number; reaction: number } {
  const d = computeDerived(c, rules)
  const style = findStyle(c.combat.style)
  return {
    defense: Math.max(0, d.defense.value + style.defense + effectValue(effets, 'defense')),
    reaction: Math.max(0, d.reaction.value + style.reaction + effectValue(effets, 'reaction')),
  }
}
