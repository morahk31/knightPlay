import { DATA_VERSION, type Character, type LogEntry } from '../rules/types'
import { blankSheet } from '../rules/catalog'
import { defaultRules } from '../config/defaultRules'

/** Clé versionnée du stockage local. */
export const STORAGE_KEY = 'knightplay.v1'

/** État sauvegardé dans le stockage local. */
export interface PersistedState {
  version: number
  characters: Character[]
  activeId: string | null
}

export interface LoadResult {
  state: PersistedState
  /** Faux si le stockage est inaccessible : l'outil fonctionne alors en mémoire. */
  storageAvailable: boolean
  /** Message à afficher à l'utilisateur, le cas échéant. */
  warning?: string
}

/** Stockage minimal utilisé (sous-ensemble de `Storage`, injectable pour les tests). */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

export function emptyState(): PersistedState {
  return { version: DATA_VERSION, characters: [], activeId: null }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Renvoie le stockage local du navigateur, ou `null` s'il est inaccessible. */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    const storage = globalThis.localStorage
    if (!storage) return null
    const probe = '__knightplay_probe__'
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Fusion récursive : part des valeurs par défaut et ne garde de `raw` que les
 * valeurs de même nature (nombre fini, chaîne, tableau, objet). Les clés en
 * trop de `raw` sont conservées (données d'une version ultérieure de l'outil).
 */
function mergeDefaults(defaults: unknown, raw: unknown): unknown {
  if (raw === undefined) return defaults
  if (typeof defaults === 'number') return typeof raw === 'number' && Number.isFinite(raw) ? raw : defaults
  if (typeof defaults === 'string') return typeof raw === 'string' ? raw : defaults
  if (typeof defaults === 'boolean') return typeof raw === 'boolean' ? raw : defaults
  if (Array.isArray(defaults)) {
    if (!Array.isArray(raw)) return defaults
    const sample = defaults[0]
    return sample === undefined ? raw.filter((v) => typeof v === 'string') : raw
  }
  if (isRecord(defaults)) {
    if (!isRecord(raw)) return defaults
    const result: Record<string, unknown> = { ...raw }
    for (const key of Object.keys(defaults)) result[key] = mergeDefaults(defaults[key], raw[key])
    return result
  }
  return raw
}

/**
 * Complète un personnage partiel ou ancien avec les champs manquants
 * (compatibilité ascendante des données). Renvoie `null` si l'entrée est inexploitable.
 */
export function normalizeCharacter(raw: unknown): Character | null {
  if (!isRecord(raw)) return null
  const now = new Date().toISOString()
  const id = typeof raw.id === 'string' && raw.id.trim() !== '' ? raw.id : newId()
  const nom = typeof raw.nom === 'string' && raw.nom.trim() !== '' ? raw.nom : 'Chevalier sans nom'
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : now
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt
  const sheet = mergeDefaults(blankSheet(defaultRules), raw) as Record<string, unknown>
  const overrides = isRecord(raw.overrides)
    ? Object.fromEntries(
        Object.entries(raw.overrides).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)),
      )
    : {}
  const journal = Array.isArray(raw.journal)
    ? raw.journal.filter(
        (e): e is LogEntry =>
          isRecord(e) && typeof e.id === 'string' && typeof e.title === 'string' && typeof e.at === 'string',
      )
    : []
  return { ...sheet, overrides, journal, id, nom, createdAt, updatedAt } as Character
}

/** Valide et normalise un état lu depuis le stockage. */
export function normalizeState(raw: unknown): PersistedState {
  if (!isRecord(raw) || !Array.isArray(raw.characters)) return emptyState()
  const characters = raw.characters
    .map(normalizeCharacter)
    .filter((c): c is Character => c !== null)
  const activeId =
    typeof raw.activeId === 'string' && characters.some((c) => c.id === raw.activeId)
      ? raw.activeId
      : (characters[0]?.id ?? null)
  return { version: DATA_VERSION, characters, activeId }
}

/** Charge l'état ; ne lève jamais d'exception. */
export function loadState(storage: KeyValueStorage | null = getBrowserStorage()): LoadResult {
  if (!storage) {
    return {
      state: emptyState(),
      storageAvailable: false,
      warning:
        'Le stockage du navigateur est indisponible : vos modifications ne seront pas conservées. Pensez à exporter vos personnages.',
    }
  }
  let text: string | null
  try {
    text = storage.getItem(STORAGE_KEY)
  } catch {
    return {
      state: emptyState(),
      storageAvailable: false,
      warning:
        'Le stockage du navigateur est illisible : vos modifications ne seront pas conservées. Pensez à exporter vos personnages.',
    }
  }
  if (text === null) return { state: emptyState(), storageAvailable: true }
  try {
    return { state: normalizeState(JSON.parse(text)), storageAvailable: true }
  } catch {
    return {
      state: emptyState(),
      storageAvailable: true,
      warning: 'Les données sauvegardées étaient corrompues et n’ont pas pu être relues.',
    }
  }
}

/** Sauvegarde l'état ; renvoie faux en cas d'échec (quota, accès refusé…). */
export function saveState(
  state: PersistedState,
  storage: KeyValueStorage | null = getBrowserStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
