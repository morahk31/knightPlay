import { DATA_VERSION, type Character, type CharacterFile } from '../rules/types'
import { newId, normalizeCharacter } from '../stores/persistence'
import { sanitizeCatalogs } from '../data/catalog'
import { sanitizeOverrides } from '../rules/houseRules'
import type { HouseRulesData } from '../stores/rules'

export type ImportResult = { ok: true; character: Character } | { ok: false; error: string }

/** Nom de fichier sûr dérivé du nom du personnage. */
export function exportFileName(character: Character): string {
  const base = character.nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `${base || 'chevalier'}.knightplay.json`
}

/** Sérialise un personnage au format d'export. */
export function serializeCharacter(character: Character, now = new Date()): string {
  const file: CharacterFile = {
    format: 'knightplay-character',
    version: DATA_VERSION,
    exportedAt: now.toISOString(),
    character,
  }
  return JSON.stringify(file, null, 2)
}

/**
 * Lit un fichier d'export. Valide le format et la version, normalise le personnage
 * et lui attribue un nouvel identifiant s'il existe déjà.
 */
export function parseCharacterFile(text: string, existingIds: Iterable<string> = []): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Ce fichier n’est pas un fichier JSON valide.' }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'Ce fichier ne contient pas de personnage KnightPlay.' }
  }
  const file = raw as Partial<CharacterFile>
  if (file.format !== 'knightplay-character') {
    return { ok: false, error: 'Ce fichier n’est pas un export de personnage KnightPlay.' }
  }
  if (typeof file.version !== 'number') {
    return { ok: false, error: 'Version du fichier absente : import impossible.' }
  }
  if (file.version > DATA_VERSION) {
    return {
      ok: false,
      error: `Ce fichier vient d’une version plus récente de KnightPlay (format ${file.version}).`,
    }
  }
  const character = normalizeCharacter(file.character)
  if (!character) {
    return { ok: false, error: 'Le personnage contenu dans le fichier est illisible.' }
  }
  const ids = new Set(existingIds)
  if (ids.has(character.id)) character.id = newId()
  return { ok: true, character }
}

function download(text: string, fileName: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Déclenche le téléchargement d'un personnage dans le navigateur. */
export function downloadCharacter(character: Character): void {
  download(serializeCharacter(character), exportFileName(character))
}

// --- Règles maison (phase 8) ---

export const RULES_FILE_NAME = 'regles-maison.knightplay-rules.json'

export interface RulesFile extends HouseRulesData {
  format: 'knightplay-rules'
  version: number
  exportedAt: string
}

export type RulesImportResult =
  | { ok: true; data: HouseRulesData; rejetees: string[] }
  | { ok: false; error: string }

export function serializeRules(data: HouseRulesData, now = new Date()): string {
  const file: RulesFile = { format: 'knightplay-rules', version: DATA_VERSION, exportedAt: now.toISOString(), ...data }
  return JSON.stringify(file, null, 2)
}

/** Lit un fichier de règles maison : format, version, paramètres connus et dans leurs bornes. */
export function parseRulesFile(text: string): RulesImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Ce fichier n’est pas un fichier JSON valide.' }
  }
  if (typeof raw !== 'object' || raw === null || (raw as { format?: unknown }).format !== 'knightplay-rules') {
    return { ok: false, error: 'Ce fichier n’est pas un export de règles KnightPlay.' }
  }
  const file = raw as Partial<RulesFile>
  if (typeof file.version !== 'number' || file.version > DATA_VERSION) {
    return { ok: false, error: 'Version du fichier de règles non prise en charge.' }
  }
  const { overrides, rejetees } = sanitizeOverrides(file.overrides)
  return { ok: true, data: { overrides, catalogues: sanitizeCatalogs(file.catalogues) }, rejetees }
}

export function downloadRules(data: HouseRulesData): void {
  download(serializeRules(data), RULES_FILE_NAME)
}
