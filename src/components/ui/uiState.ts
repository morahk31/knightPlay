/** Mémorisation légère de l'état d'affichage (bloc ouvert, onglet choisi) : confort par navigateur, jamais indispensable. */

const PREFIX = 'knightplay.ui.'

export function readUiState<T extends string | boolean>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key)
    if (raw === null || raw === undefined) return fallback
    if (typeof fallback === 'boolean') return (raw === 'true') as T
    return raw as T
  } catch {
    return fallback
  }
}

export function writeUiState(key: string, value: string | boolean): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, String(value))
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'état n'est simplement pas retenu.
  }
}
