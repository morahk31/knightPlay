import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { exportFileName, parseCharacterFile, serializeCharacter } from '../src/services/fileIO'
import type { Character } from '../src/rules/types'
import { useCharactersStore } from '../src/stores/characters'
import type { KeyValueStorage } from '../src/stores/persistence'
import TopBar from '../src/components/TopBar.vue'

const eraser: Character = {
  id: 'eraser-1',
  nom: 'Silas « Eraser » Shark',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T11:00:00.000Z',
}

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

describe('export et import (service)', () => {
  it('réimporte à l’identique un personnage exporté (hors identifiant en cas de doublon)', () => {
    const text = serializeCharacter(eraser)
    const fresh = parseCharacterFile(text, [])
    expect(fresh).toEqual({ ok: true, character: eraser })

    const duplicate = parseCharacterFile(text, [eraser.id])
    expect(duplicate.ok).toBe(true)
    if (duplicate.ok) {
      expect(duplicate.character.id).not.toBe(eraser.id)
      const { id: _id, ...rest } = duplicate.character
      const { id: _orig, ...expected } = eraser
      expect(rest).toEqual(expected)
    }
  })

  it('refuse un fichier qui n’est pas du JSON', () => {
    const result = parseCharacterFile('ceci n’est pas du json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/JSON/)
  })

  it('refuse un fichier sans format ni version', () => {
    expect(parseCharacterFile(JSON.stringify({ character: eraser })).ok).toBe(false)
    const noVersion = parseCharacterFile(
      JSON.stringify({ format: 'knightplay-character', character: eraser }),
    )
    expect(noVersion.ok).toBe(false)
    if (!noVersion.ok) expect(noVersion.error).toMatch(/Version/)
  })

  it('refuse un fichier d’une version future', () => {
    const future = parseCharacterFile(
      JSON.stringify({ format: 'knightplay-character', version: 99, character: eraser }),
    )
    expect(future.ok).toBe(false)
  })

  it('refuse un personnage illisible', () => {
    const result = parseCharacterFile(
      JSON.stringify({ format: 'knightplay-character', version: 1, character: 'x' }),
    )
    expect(result.ok).toBe(false)
  })

  it('produit un nom de fichier sûr', () => {
    expect(exportFileName(eraser)).toBe('Silas_Eraser_Shark.knightplay.json')
    expect(exportFileName({ ...eraser, nom: '«»' })).toBe('chevalier.knightplay.json')
  })
})

describe('barre du haut', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup() {
    const store = useCharactersStore()
    store.init(memoryStorage())
    const wrapper = mount(TopBar)
    return { store, wrapper }
  }

  async function chooseFile(wrapper: ReturnType<typeof mount>, content: string) {
    const input = wrapper.get('[data-testid="import-input"]').element as HTMLInputElement
    const file = new File([content], 'perso.json', { type: 'application/json' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.get('[data-testid="import-input"]').trigger('change')
    await flushPromises()
  }

  it('importe un fichier valide et le sélectionne', async () => {
    const { store, wrapper } = setup()
    await chooseFile(wrapper, serializeCharacter(eraser))
    expect(store.characters).toHaveLength(2)
    expect(store.active?.nom).toBe(eraser.nom)
    expect(wrapper.get('[data-testid="topbar-message"]').text()).toContain('importé')
  })

  it('refuse un fichier invalide sans modifier les données', async () => {
    const { store, wrapper } = setup()
    const before = JSON.stringify(store.characters)
    await chooseFile(wrapper, '{"nimporte":"quoi"}')
    expect(JSON.stringify(store.characters)).toBe(before)
    expect(wrapper.get('[data-testid="topbar-message"]').classes()).toContain('error')
  })

  it('demande confirmation avant de supprimer', async () => {
    const { store, wrapper } = setup()
    store.create('À garder')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await wrapper.get('[data-testid="btn-delete"]').trigger('click')
    expect(confirm).toHaveBeenCalledOnce()
    expect(store.characters).toHaveLength(2)

    confirm.mockReturnValueOnce(true)
    await wrapper.get('[data-testid="btn-delete"]').trigger('click')
    expect(store.characters).toHaveLength(1)
    confirm.mockRestore()
  })

  it('crée et duplique depuis les boutons', async () => {
    const { store, wrapper } = setup()
    await wrapper.get('[data-testid="btn-new"]').trigger('click')
    expect(store.characters).toHaveLength(2)
    await wrapper.get('[data-testid="btn-duplicate"]').trigger('click')
    expect(store.characters).toHaveLength(3)
    expect(store.active?.nom).toContain('(copie)')
  })
})
