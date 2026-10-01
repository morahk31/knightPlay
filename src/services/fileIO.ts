import { DATA_VERSION, type Character, type CharacterFile } from '../rules/types'
import { newId, normalizeCharacter } from '../stores/persistence'

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

/** Déclenche le téléchargement d'un personnage dans le navigateur. */
export function downloadCharacter(character: Character): void {
  const blob = new Blob([serializeCharacter(character)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(character)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
