import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useCharactersStore } from '../src/stores/characters'
import { useLogStore } from '../src/stores/log'
import { normalizeCharacter } from '../src/stores/persistence'
import { parseCharacterFile, serializeCharacter } from '../src/services/fileIO'
import ActionsPanel from '../src/components/ActionsPanel.vue'
import NotesPanel from '../src/components/sheet/NotesPanel.vue'
import { memoryStorage } from './helpers'

function shown(el: { attributes: (name: string) => string | undefined }): boolean {
  return !(el.attributes('style') ?? '').includes('display: none')
}

const PANES = ['test', 'attaque', 'encaisser', 'energie', 'journal']

function visiblePanes(wrapper: ReturnType<typeof mount>): string[] {
  return PANES.filter((p) => shown(wrapper.get(`[data-testid="action-pane-${p}"]`)))
}

describe('colonne d’actions en onglets', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useCharactersStore().init(memoryStorage())
  })

  it('un seul panneau visible ; l’onglet Attaque affiche seulement l’attaque', async () => {
    const wrapper = mount(ActionsPanel)
    expect(visiblePanes(wrapper)).toEqual(['test'])
    await wrapper.get('[data-testid="action-tab-attaque"]').trigger('click')
    expect(visiblePanes(wrapper)).toEqual(['attaque'])
    expect(wrapper.get('[data-testid="action-tab-attaque"]').attributes('aria-selected')).toBe('true')
  })

  it('clic sur une caractéristique de la fiche : onglet Test ouvert avec la base proposée', async () => {
    const wrapper = mount(ActionsPanel, { props: { pendingBase: null, pickSignal: 0 } })
    await wrapper.get('[data-testid="action-tab-journal"]').trigger('click')
    await wrapper.setProps({ pendingBase: 'tir', pickSignal: 1 })
    expect(visiblePanes(wrapper)).toEqual(['test'])
    expect((wrapper.get('[data-testid="test-base"]').element as HTMLSelectElement).value).toBe('tir')
    // Même caractéristique une seconde fois, après être passé ailleurs.
    await wrapper.get('[data-testid="action-tab-energie"]').trigger('click')
    await wrapper.setProps({ pendingBase: 'tir', pickSignal: 2 })
    expect(visiblePanes(wrapper)).toEqual(['test'])
  })

  it('le badge du Journal compte les entrées', async () => {
    const wrapper = mount(ActionsPanel)
    expect(wrapper.find('[data-testid="journal-badge"]').exists()).toBe(false)
    useLogStore().add({ kind: 'test', title: 'Test Tir', detail: '', outcome: 'reussite' })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="journal-badge"]').text()).toBe('1')
  })

  it('l’onglet choisi est retrouvé au rechargement', async () => {
    const first = mount(ActionsPanel)
    await first.get('[data-testid="action-tab-encaisser"]').trigger('click')
    first.unmount()
    const second = mount(ActionsPanel)
    expect(visiblePanes(second)).toEqual(['encaisser'])
  })

  it('flèches du clavier : onglet suivant et précédent', async () => {
    const wrapper = mount(ActionsPanel, { attachTo: document.body })
    const nav = wrapper.get('[role="tablist"]')
    await nav.trigger('keydown', { key: 'ArrowRight' })
    expect(visiblePanes(wrapper)).toEqual(['attaque'])
    await nav.trigger('keydown', { key: 'ArrowLeft' })
    await nav.trigger('keydown', { key: 'ArrowLeft' })
    expect(visiblePanes(wrapper)).toEqual(['journal'])
    wrapper.unmount()
  })
})

describe('onglet Notes', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('une note saisie est conservée au rechargement et dans l’export', async () => {
    const storage = memoryStorage()
    const store = useCharactersStore()
    store.init(storage)
    const wrapper = mount(NotesPanel)
    await wrapper.get('[data-testid="notes-text"]').setValue('Le Corbeau a parlé du Chevalier Noir.')
    expect(wrapper.get('[data-testid="notes-count"]').text()).toBe('37 caractères')
    store.flush()

    setActivePinia(createPinia())
    const reloaded = useCharactersStore()
    reloaded.init(storage)
    expect(reloaded.active!.notes).toBe('Le Corbeau a parlé du Chevalier Noir.')

    const parsed = parseCharacterFile(serializeCharacter(reloaded.active!))
    expect(parsed.ok && parsed.character.notes).toBe('Le Corbeau a parlé du Chevalier Noir.')
  })

  it('un ancien fichier sans notes s’importe avec des notes vides', () => {
    const store = (setActivePinia(createPinia()), useCharactersStore())
    store.init(memoryStorage())
    const ancien = JSON.parse(JSON.stringify(store.active)) as Record<string, unknown>
    delete ancien.notes
    expect(normalizeCharacter(ancien)!.notes).toBe('')
  })
})
