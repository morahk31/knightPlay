import type { KeyValueStorage } from '../src/stores/persistence'

/** RNG qui renvoie les faces voulues, dans l'ordre (puis recommence). */
export function facesRng(faces: number[]): () => number {
  let i = 0
  return () => {
    const f = faces[i++ % faces.length]!
    return (f - 1) / 6 + 0.0001
  }
}

/** Stockage en mémoire, pour simuler localStorage. */
export function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}
