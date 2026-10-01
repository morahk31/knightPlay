import type { EffectRef } from './types'

/**
 * Effets d'armes (référentiel : fiche 08, LdB p. 415-418 ; fiche 13 pour 2038 et le codex 4).
 * `calcule` = pris en compte automatiquement par le calcul d'attaque ; sinon affiché en rappel.
 */
export interface EffectDef {
  id: string
  /** Libellé tel qu'il s'écrit dans les profils (minuscules, sans le X). */
  label: string
  /** L'effet prend une valeur X. */
  x?: boolean
  description: string
  calcule?: boolean
}

export const EFFECTS: readonly EffectDef[] = [
  { id: 'anti-anatheme', label: 'anti-Anathème', description: 'Ignore le bouclier et la Chair exceptionnelle des créatures de l’Anathème.' },
  { id: 'anti-vehicule', label: 'anti-véhicule', description: 'Pas de tranches de 10 contre les véhicules et les colosses.' },
  { id: 'artillerie', label: 'artillerie', description: 'Cible désignée touchable sans ligne de vue ni malus de portée, sans bonus de couvert.' },
  { id: 'assassin', label: 'assassin', x: true, calcule: true, description: '+XD6 aux dégâts en cas d’attaque surprise.' },
  { id: 'assistance', label: 'assistance à l’attaque', calcule: true, description: '+1 dégât (ou violence) par réussite au-delà de la défense ou de la réaction.' },
  { id: 'barrage', label: 'barrage', x: true, description: 'À la place d’une attaque : −X en défense et réaction de la cible jusqu’au prochain tour (cumulable).' },
  { id: 'cadence', label: 'cadence', x: true, description: 'X cibles différentes, une attaque par cible à −3 dés.' },
  { id: 'chargeur', label: 'chargeur', x: true, description: 'X utilisations, rechargées à Camelot.' },
  { id: 'choc', label: 'choc', x: true, calcule: true, description: 'Si les réussites dépassent la Chair (÷ 2 pour un PNJ), la cible perd X actions. Pas sur les bandes.' },
  { id: 'defense', label: 'défense', x: true, calcule: true, description: '+X en défense tant que l’arme est utilisée.' },
  { id: 'reaction', label: 'réaction', x: true, calcule: true, description: '+X en réaction tant que l’arme est utilisée.' },
  { id: 'degats-continus', label: 'dégâts continus', x: true, description: 'X dégâts par tour pendant 1D6 tours, en ignorant CdF et bouclier.' },
  { id: 'demoralisant', label: 'démoralisant', description: '−2 au débordement d’une bande humaine pour ce tour.' },
  { id: 'designation', label: 'désignation', calcule: true, description: 'Cible désignée : +1 réussite automatique au tir pour soi et ses alliés, pas d’échec critique.' },
  { id: 'destructeur', label: 'destructeur', calcule: true, description: '+2D6 aux dégâts si les PA sont touchés.' },
  { id: 'deux-mains', label: 'deux mains', description: 'Il faut les deux mains.' },
  { id: 'dispersion', label: 'dispersion', x: true, description: 'Touche X ennemis à moins de 2 m les uns des autres. Pas contre les bandes.' },
  { id: 'en-chaine', label: 'en chaîne', description: 'Après avoir éliminé un hostile ou un salopard : nouvelle attaque pour 3 PE.' },
  { id: 'fureur', label: 'fureur', calcule: true, description: '+4D6 de violence contre une bande de Chair 10 ou plus.' },
  { id: 'ignore-armure', label: 'ignore armure', description: 'Les dégâts (après CdF et bouclier) vont directement aux PS.' },
  { id: 'ignore-cdf', label: 'ignore CdF', description: 'Ignore le champ de force.' },
  { id: 'jumele-akimbo', label: 'jumelé (akimbo)', calcule: true, description: 'Malus du style akimbo réduit à −1 dé.' },
  { id: 'jumele-ambidextrie', label: 'jumelé (ambidextrie)', calcule: true, description: 'Malus du style ambidextre réduit à −1 dé.' },
  { id: 'leste', label: 'lesté', calcule: true, description: 'Force × 2 aux dégâts (Force 4 ou 1 OD de Force requis).' },
  { id: 'lourd', label: 'lourd', description: 'Attaquer coûte une action de déplacement et une action de combat ; implique deux mains.' },
  { id: 'lumiere', label: 'lumière', x: true, description: 'Contre l’Anathème : −X en défense et réaction jusqu’à la fin du prochain tour (non cumulable).' },
  { id: 'meurtrier', label: 'meurtrier', calcule: true, description: '+2D6 aux dégâts si les PS sont touchés.' },
  { id: 'orfevrerie', label: 'orfèvrerie', calcule: true, description: '+ Dextérité (et OD) aux dégâts.' },
  { id: 'parasitage', label: 'parasitage', x: true, description: 'Contre les machines : perte de X actions.' },
  { id: 'penetrant', label: 'pénétrant', x: true, description: 'Ignore X points de CdF (pas le bouclier).' },
  { id: 'perce-armure', label: 'perce armure', x: true, description: 'Si X ≥ PA restants, les PA sont ignorés et les dégâts vont aux PS.' },
  { id: 'precision', label: 'précision', calcule: true, description: '+ Tir (et OD) aux dégâts.' },
  { id: 'silencieux', label: 'silencieux', calcule: true, description: 'Pas de repérage ; en attaque surprise, invisible, Ghost ou Changeling : + Discrétion (et OD) aux dégâts.' },
  { id: 'soumission', label: 'soumission', description: 'Immobilise la cible (se libérer : Déplacement ou Combat contre les réussites de l’attaquant).' },
  { id: 'tir-rafale', label: 'tir en rafale', description: 'Une relance des dégâts par attaque (on garde le nouveau résultat).' },
  { id: 'tir-securite', label: 'tir en sécurité', description: 'Bonus de mise à couvert sans le malus au tir.' },
  { id: 'ultraviolence', label: 'ultraviolence', calcule: true, description: '+2D6 de violence contre une bande de Chair inférieure à 10.' },
  { id: 'tenebricide', label: 'ténébricide', calcule: true, description: 'Contre les humains : moitié des dés de dégâts et de violence.' },
  { id: 'esperance', label: 'espérance', description: 'Contre les désespérés : test pour sortir du désespoir au lieu de dégâts.' },
  { id: 'obliteration', label: 'oblitération', calcule: true, description: 'Contre un hostile : dégâts au maximum, sans lancer.' },
  { id: 'main-libre', label: 'main libre', description: 'Laisse une main libre.' },
  { id: 'indestructible', label: 'indestructible', description: 'L’arme ne peut pas être cassée.' },
  { id: 'non-letal', label: 'non létal', description: 'Ne tue pas.' },
]

const BY_ID = new Map(EFFECTS.map((e) => [e.id, e]))

/** Formes acceptées en saisie, en plus du libellé (sans accents ni casse). */
const ALIASES: Record<string, string> = {
  assistance: 'assistance',
  'assistance a l attaque': 'assistance',
  'jumele akimbo': 'jumele-akimbo',
  'jumele ambidextrie': 'jumele-ambidextrie',
  'cdf ignore': 'ignore-cdf',
  'ignore champ de force': 'ignore-cdf',
  'tir en securite': 'tir-securite',
  'tir en rafale': 'tir-rafale',
  'non letale': 'non-letal',
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const BY_KEY = new Map<string, string>([
  ...EFFECTS.map((e) => [normalize(e.label), e.id] as [string, string]),
  ...Object.entries(ALIASES),
])

export function findEffect(id: string): EffectDef | undefined {
  return BY_ID.get(id)
}

/** Libellé d'un effet, avec sa valeur : « perce armure 40 ». */
export function effectLabel(ref: EffectRef): string {
  return ref.x !== undefined ? `${ref.label} ${ref.x}` : ref.label
}

/** Analyse « meurtrier, perce armure 40, jumelé (akimbo) » en références d'effets. */
export function parseEffects(text: string): EffectRef[] {
  return text
    .split(/[,;/]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^(.*?)\s+(\d+)$/.exec(part)
      const name = match ? match[1]! : part
      const x = match ? Number(match[2]) : undefined
      const id = BY_KEY.get(normalize(name))
      const def = id ? BY_ID.get(id) : undefined
      if (!def) return { id: 'autre', label: part }
      return x !== undefined && def.x ? { id: def.id, x, label: def.label } : { id: def.id, label: def.label }
    })
}

export function formatEffects(effets: readonly EffectRef[]): string {
  return effets.map(effectLabel).join(', ')
}

export function hasEffect(effets: readonly EffectRef[], id: string): boolean {
  return effets.some((e) => e.id === id)
}

/** Valeur X d'un effet (somme si présent plusieurs fois), 0 s'il est absent. */
export function effectValue(effets: readonly EffectRef[], id: string): number {
  return effets.filter((e) => e.id === id).reduce((sum, e) => sum + (e.x ?? 0), 0)
}

/** Description d'un effet, pour les infobulles. */
export function effectDescription(ref: EffectRef): string {
  return findEffect(ref.id)?.description ?? 'Effet personnalisé.'
}
