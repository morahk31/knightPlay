import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import {
  STORAGE_KEY,
  loadState,
  normalizeCharacter,
  saveState,
  type KeyValueStorage,
} from '../src/stores/persistence'
import { DEFAULT_CHARACTER_NAME, createCharacter, useCharactersStore } from '../src/stores/characters'

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
}

const throwingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

describe('persistence', () => {
  it('sauvegarde puis relit le même état', () => {
    const storage = memoryStorage()
    const state = {
      version: 1,
      characters: [{ ...createCharacter('Eraser'), id: 'a' }],
      activeId: 'a',
    }
    expect(saveState(state, storage)).toBe(true)
    const result = loadState(storage)
    expect(result.storageAvailable).toBe(true)
    expect(result.warning).toBeUndefined()
    expect(result.state).toEqual(state)
  })

  it('renvoie un état vide sans erreur quand rien n’est sauvegardé', () => {
    const result = loadState(memoryStorage())
    expect(result.state.characters).toEqual([])
    expect(result.state.activeId).toBeNull()
    expect(result.warning).toBeUndefined()
  })

  it('signale un stockage indisponible sans lever d’exception', () => {
    expect(() => loadState(throwingStorage)).not.toThrow()
    const result = loadState(throwingStorage)
    expect(result.storageAvailable).toBe(false)
    expect(result.warning).toMatch(/stockage/i)
    expect(loadState(null).storageAvailable).toBe(false)
    expect(saveState(result.state, throwingStorage)).toBe(false)
  })

  it('résiste à des données corrompues', () => {
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, '{pas du json')
    const result = loadState(storage)
    expect(result.state.characters).toEqual([])
    expect(result.warning).toMatch(/corrompues/)
  })

  it('normalise un personnage incomplet et rejette une entrée inexploitable', () => {
    const c = normalizeCharacter({ nom: 'Silas' })
    expect(c?.nom).toBe('Silas')
    expect(c?.id).toBeTruthy()
    expect(c?.createdAt).toBeTruthy()
    expect(normalizeCharacter('texte')).toBeNull()
    expect(normalizeCharacter(null)).toBeNull()
  })

  it('corrige un personnage actif qui n’existe plus', () => {
    const storage = memoryStorage()
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, characters: [{ id: 'x', nom: 'X' }], activeId: 'disparu' }),
    )
    expect(loadState(storage).state.activeId).toBe('x')
  })
})

describe('store des personnages', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('crée un premier personnage au démarrage si aucun n’existe', () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    expect(store.characters).toHaveLength(1)
    expect(store.active?.nom).toBe(DEFAULT_CHARACTER_NAME)
  })

  it('restaure les personnages et le personnage actif après un « rechargement »', async () => {
    const storage = memoryStorage()
    const first = useCharactersStore()
    first.init(storage)
    const created = first.create('Eraser')
    first.rename(created.id, 'Silas « Eraser » Shark')
    await nextTick()
    first.flush()

    setActivePinia(createPinia())
    const reloaded = useCharactersStore()
    reloaded.init(storage)
    expect(reloaded.characters).toHaveLength(2)
    expect(reloaded.activeId).toBe(created.id)
    expect(reloaded.active?.nom).toBe('Silas « Eraser » Shark')
  })

  it('sauvegarde automatiquement après un délai', async () => {
    const storage = memoryStorage()
    const store = useCharactersStore()
    store.init(storage)
    store.create('Auto')
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(storage.data.get(STORAGE_KEY)).toContain('Auto')
  })

  it('reste utilisable en mémoire si le stockage est indisponible', () => {
    const store = useCharactersStore()
    store.init(throwingStorage)
    expect(store.storageWarning).toMatch(/stockage/i)
    const c = store.create('En mémoire')
    expect(store.active?.id).toBe(c.id)
    expect(() => store.flush()).not.toThrow()
  })

  it('duplique, sélectionne et supprime', () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    const original = store.active!
    const copy = store.duplicate(original.id)!
    expect(copy.id).not.toBe(original.id)
    expect(copy.nom).toBe(`${original.nom} (copie)`)
    expect(store.activeId).toBe(copy.id)
    store.select(original.id)
    expect(store.activeId).toBe(original.id)
    store.remove(original.id)
    expect(store.characters.map((c) => c.id)).toEqual([copy.id])
    expect(store.activeId).toBe(copy.id)
  })

  it('recrée un personnage quand on supprime le dernier', () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.remove(store.active!.id)
    expect(store.characters).toHaveLength(1)
    expect(store.active?.nom).toBe(DEFAULT_CHARACTER_NAME)
  })

  it('ignore un renommage vide', () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    const id = store.active!.id
    store.rename(id, '   ')
    expect(store.active?.nom).toBe(DEFAULT_CHARACTER_NAME)
  })
})
