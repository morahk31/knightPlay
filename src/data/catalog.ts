import { ARMORS } from './armors'
import { MODULES } from './modules'
import { WEAPONS } from './weapons'
import { EFFECTS, type EffectDef } from '../rules/effects'
import type { ArmorDef, ModuleDef, WeaponDef } from '../rules/types'

/**
 * Catalogues personnalisés (règles maison) : une entrée personnalisée ajoute un élément,
 * ou remplace l'élément fourni qui a le même identifiant ; les identifiants masqués disparaissent des listes.
 */
export interface CustomCatalogs {
  armures: ArmorDef[]
  armes: WeaponDef[]
  modules: ModuleDef[]
  effets: EffectDef[]
  /** Identifiants d'éléments fournis masqués. */
  masques: string[]
}

export type CatalogKind = 'armures' | 'armes' | 'modules' | 'effets'

export function emptyCatalogs(): CustomCatalogs {
  return { armures: [], armes: [], modules: [], effets: [], masques: [] }
}

function merge<T extends { id: string }>(base: readonly T[], custom: readonly T[], masques: readonly string[]): T[] {
  const byId = new Map(custom.map((x) => [x.id, x]))
  const merged = base.map((x) => byId.get(x.id) ?? x)
  const added = custom.filter((x) => !base.some((b) => b.id === x.id))
  return [...merged, ...added].filter((x) => !masques.includes(x.id))
}

export interface MergedCatalogs {
  armures: ArmorDef[]
  armes: WeaponDef[]
  modules: ModuleDef[]
  effets: EffectDef[]
}

export function mergeCatalogs(custom: CustomCatalogs): MergedCatalogs {
  return {
    armures: merge(ARMORS, custom.armures, custom.masques),
    armes: merge(WEAPONS, custom.armes, custom.masques),
    modules: merge(MODULES, custom.modules, custom.masques),
    effets: merge(EFFECTS, custom.effets, custom.masques),
  }
}

/** Éléments fournis (non personnalisés) d'un catalogue, pour « copier pour corriger » et masquer. */
export function builtIn(kind: CatalogKind): readonly { id: string; nom?: string; label?: string }[] {
  return { armures: ARMORS, armes: WEAPONS, modules: MODULES, effets: EFFECTS }[kind]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Validation minimale des catalogues importés : identifiant et nom présents, structure attendue. */
export function sanitizeCatalogs(raw: unknown): CustomCatalogs {
  const out = emptyCatalogs()
  if (!isRecord(raw)) return out
  const list = (key: string) => (Array.isArray(raw[key]) ? (raw[key] as unknown[]).filter(isRecord) : [])
  out.armures = list('armures').filter((a) => typeof a.id === 'string' && typeof a.nom === 'string' && isRecord(a.slots)) as unknown as ArmorDef[]
  out.armes = list('armes').filter((w) => typeof w.id === 'string' && typeof w.nom === 'string' && Array.isArray(w.profils)) as unknown as WeaponDef[]
  out.modules = list('modules').filter((m) => typeof m.id === 'string' && typeof m.nom === 'string' && Array.isArray(m.niveaux) && m.niveaux.length > 0) as unknown as ModuleDef[]
  out.effets = list('effets').filter((e) => typeof e.id === 'string' && typeof e.label === 'string') as unknown as EffectDef[]
  out.masques = Array.isArray(raw.masques) ? raw.masques.filter((x): x is string => typeof x === 'string') : []
  return out
}
