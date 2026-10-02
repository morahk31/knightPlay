import { findChassis } from '../data/legend'
import { boughtCount, legendProfile } from './legend'
import { parseEffects } from './effects'
import type { Character, OwnedWeapon, Portee, WeaponProfile } from './types'

/**
 * Fusil Longbow de la Ranger : livre de base (p. 157, FAQ 2020 p. 11-12)
 * ou Arsenal de légende (p. 23-24).
 */

export const LONGBOW_LDB_ID = 'longbow'
export const LONGBOW_ARSENAL_ID = 'longbow-arsenal'

export const MINEURS_LDB = ['dégâts continus 3', 'silencieux', 'choc 1', 'perce armure 40', 'ultraviolence', 'désignation']
export const MINEURS_ARSENAL = ['silencieux', 'choc 1', 'perce armure 40', 'ultraviolence', 'désignation', 'non létal']
export const INTERMEDIAIRES = ['lumière 4', 'anti-véhicule', 'dispersion 3', 'artillerie', 'pénétrant 6', 'perce armure 60']
export const MAJEURS = ['anti-Anathème', 'démoralisant', 'pénétrant 10', 'ignore armure', 'en chaîne', 'fureur']
/** Effets par liste et par tir (FAQ 2020). */
export const MAX_PAR_LISTE = 3

export type LongbowMode = 'ldb' | 'arsenal'

export function longbowMode(weapon: OwnedWeapon | null | undefined): LongbowMode | null {
  if (!weapon) return null
  if (weapon.legende?.base === 'longbow') return 'arsenal'
  if (weapon.weaponId === LONGBOW_LDB_ID) return 'ldb'
  return null
}

function evolution(c: Character, id: string): boolean {
  return c.armure.modele === 'ranger' && c.armure.evolutions.some((e) => e.id === id && e.possedee)
}

export interface LongbowCaps {
  mode: LongbowMode
  /** Dés de boost maximum. */
  boostMax: number
  mineurs: string[]
  /** Effets à 6 PE disponibles. */
  majeurs: boolean
  /** −2 PE par effet ajouté (minimum 1). */
  economie: boolean
}

export function longbowCaps(c: Character, weapon: OwnedWeapon): LongbowCaps | null {
  const mode = longbowMode(weapon)
  if (mode === 'ldb') {
    return {
      mode,
      boostMax: evolution(c, 'longbow-profil') ? 9 : 6,
      mineurs: MINEURS_LDB,
      majeurs: evolution(c, 'longbow-majeurs'),
      economie: evolution(c, 'longbow-economie'),
    }
  }
  if (mode === 'arsenal') {
    const state = weapon.legende!
    return {
      mode,
      boostMax: boughtCount(state, 'boost14') ? 14 : 9,
      mineurs: MINEURS_ARSENAL,
      majeurs: boughtCount(state, 'effets-majeurs') > 0,
      economie: boughtCount(state, 'economie') > 0,
    }
  }
  return null
}

/** Profil de base du Longbow (sans les ajouts du tir). */
export function longbowProfile(c: Character, weapon: OwnedWeapon): WeaponProfile | null {
  const mode = longbowMode(weapon)
  if (mode === 'arsenal') {
    const chassis = findChassis('longbow')!
    return legendProfile(chassis, weapon.legende!)
  }
  if (mode === 'ldb') {
    const fort = evolution(c, 'longbow-profil')
    const lourd = !evolution(c, 'longbow-mobile')
    return {
      nom: 'Longbow',
      type: 'distance',
      degats: { des: fort ? 5 : 3, fixe: 0 },
      violence: { des: fort ? 3 : 1, fixe: 0 },
      portee: 'moyenne',
      effets: parseEffects(`${lourd ? 'lourd, ' : ''}deux mains, assistance à l’attaque`),
    }
  }
  return null
}

export interface LongbowShot {
  /** PE convertis en dés (boost). */
  boost: number
  boostVers: 'degats' | 'violence'
  /** Crans de portée gagnés (1 PE chacun). */
  portee: number
  mineurs: string[]
  intermediaires: string[]
  majeurs: string[]
}

export const EMPTY_SHOT: LongbowShot = { boost: 0, boostVers: 'degats', portee: 0, mineurs: [], intermediaires: [], majeurs: [] }

export interface LongbowCost {
  pe: number
  detail: string[]
  erreurs: string[]
}

/** Coût en PE d'un tir : boost + portée + effets ajoutés (2 / 3 / 6 PE, −2 avec Économie, minimum 1). */
export function longbowCost(shot: LongbowShot, caps: LongbowCaps): LongbowCost {
  const detail: string[] = []
  const erreurs: string[] = []
  const boost = Math.max(0, Math.trunc(shot.boost))
  if (boost > caps.boostMax) erreurs.push(`Boost limité à ${caps.boostMax}D6.`)
  if (shot.mineurs.length > MAX_PAR_LISTE || shot.intermediaires.length > MAX_PAR_LISTE || shot.majeurs.length > MAX_PAR_LISTE) {
    erreurs.push(`${MAX_PAR_LISTE} effets au maximum par liste.`)
  }
  if (shot.majeurs.length && !caps.majeurs) erreurs.push('Effets majeurs non acquis.')
  const effet = (base: number) => (caps.economie ? Math.max(1, base - 2) : base)
  const portee = Math.max(0, Math.min(2, Math.trunc(shot.portee)))
  let pe = 0
  if (boost) {
    pe += boost
    detail.push(`boost ${boost}D6 : ${boost} PE`)
  }
  if (portee) {
    pe += portee
    detail.push(`portée +${portee} : ${portee} PE`)
  }
  for (const [list, base] of [[shot.mineurs, 2], [shot.intermediaires, 3], [shot.majeurs, 6]] as const) {
    for (const e of list) {
      pe += effet(base)
      detail.push(`${e} : ${effet(base)} PE`)
    }
  }
  return { pe, detail, erreurs }
}

const PORTEES: Portee[] = ['contact', 'courte', 'moyenne', 'longue', 'lointaine']

/** Profil du tir : effets ajoutés et portée augmentée (le boost passe par les options d'attaque). */
export function shotProfile(profile: WeaponProfile, shot: LongbowShot): WeaponProfile {
  const ajout = parseEffects([...shot.mineurs, ...shot.intermediaires, ...shot.majeurs].join(', '))
  const ids = new Set(ajout.map((e) => e.id))
  const i = Math.min(PORTEES.length - 1, PORTEES.indexOf(profile.portee) + Math.max(0, Math.min(2, Math.trunc(shot.portee))))
  return { ...profile, portee: PORTEES[i]!, effets: [...profile.effets.filter((e) => !ids.has(e.id)), ...ajout] }
}
