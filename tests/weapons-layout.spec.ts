import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useCharactersStore } from '../src/stores/characters'
import WeaponsPanel from '../src/components/sheet/WeaponsPanel.vue'
import ProgressionPanel from '../src/components/sheet/ProgressionPanel.vue'
import { legendProfiles } from '../src/rules/legend'
import { memoryStorage } from './helpers'

function shown(el: { attributes: (name: string) => string | undefined }): boolean {
  return !(el.attributes('style') ?? '').includes('display: none')
}

/** Silas : Longbow (arsenal) avec Chirurgical et Précision, lame, pistolet, grenades ; 25 PX, 50 / 110 PG. */
function silas() {
  const store = useCharactersStore()
  store.init(memoryStorage())
  store.setArmorModel('ranger')
  store.addWeapon('longbow-arsenal')
  store.addWeapon('lame-polymorphique')
  store.addWeapon('pistolet-polycalibre')
  store.addWeapon('grenades')
  store.mutateActive((c) => {
    const lb = c.armes[0]!
    lb.legende!.achats = { chirurgical: 1, precision: 1 }
    lb.profils = legendProfiles(lb.legende!)
    c.progression = { ...c.progression, pxActuel: 25, pxTotal: 25, pgSolde: 50, pgTotal: 110 }
  })
  return store
}

describe('onglet Armes', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('4 cartes repliées avec un résumé lisible par arme', () => {
    silas()
    const wrapper = mount(WeaponsPanel)
    const cards = wrapper.findAll('[data-testid="weapon-item"]')
    expect(cards).toHaveLength(4)
    for (const card of cards) expect(shown(card.get('[data-testid="collapsible-body"]'))).toBe(false)
    const longbow = cards[0]!.get('[data-testid="weapon-summary"]').text()
    expect(longbow).toContain('3D6 / 1D6')
    expect(longbow).toContain('moyenne')
    expect(longbow).toContain('Fusil Longbow · 20 PG investis · 2 optimisations')
    expect(cards[1]!.get('[data-testid="weapon-summary"]').text()).toContain('2D6 + Force / 1D6')
    expect(cards[1]!.get('[data-testid="weapon-summary"]').text()).toContain('sans châssis')
  })

  it('arme à 5 profils : résumé sur une ligne, détail au dépliage', async () => {
    silas()
    const wrapper = mount(WeaponsPanel)
    const grenades = wrapper.findAll('[data-testid="weapon-item"]')[3]!
    expect(grenades.get('[data-testid="weapon-summary"]').text()).toContain('5 profils')
    expect(grenades.findAll('.weapon-profile')).toHaveLength(5)
    await grenades.get('[data-testid="collapsible-toggle"]').trigger('click')
    expect(shown(grenades.get('[data-testid="collapsible-body"]'))).toBe(true)
  })

  it('déplier le Longbow : profil et effets visibles, arbre résumé puis déplié', async () => {
    silas()
    const wrapper = mount(WeaponsPanel)
    const longbow = wrapper.findAll('[data-testid="weapon-item"]')[0]!
    await longbow.findAll('[data-testid="collapsible-toggle"]')[0]!.trigger('click')
    expect(longbow.get('.weapon-effects').text()).toContain('chirurgical')
    const legend = longbow.get('[data-testid="legend-section"]')
    expect(legend.text()).toContain('20 PG investis')
    expect(shown(legend.get('[data-testid="collapsible-body"]'))).toBe(false)
    await legend.get('[data-testid="collapsible-toggle"]').trigger('click')
    expect(legend.get('[data-testid="legend-opt-chirurgical"]').classes()).toContain('complete')
    expect(legend.get('[data-testid="legend-opt-precision"]').classes()).toContain('complete')
  })
})

describe('onglet Progression', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('soldes en tuiles : 25 PX, 50 PG disponibles, 110 PG gagnés', () => {
    silas()
    const wrapper = mount(ProgressionPanel)
    const tiles = wrapper.findAll('.soldes .stat-tile-value').map((t) => t.text())
    expect(tiles).toEqual(['25', '25', '50', '110'])
  })

  it('acheter Combat +1 : historique avec son type et −PX ; bouton bloqué quand le solde manque', async () => {
    const store = silas()
    store.setAspect('bete', 4)
    const wrapper = mount(ProgressionPanel)
    await wrapper.get('[data-testid="up-carac-combat"]').trigger('click')
    const item = wrapper.get('[data-testid="history-item"]')
    expect(item.get('.history-kind').text()).toBe('Caractéristique')
    expect(item.text()).toContain('−4 PX')
    expect(wrapper.get('[data-testid="history-totals"]').text()).toContain('PX +0 / −4')
    // Aspect Chair 2 → 3 : 15 PX, il reste 21 PX ; Machine 2 → 3 aussi ; au-delà le solde manque.
    store.adjustProgression('pxActuel', 3)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="up-aspect-chair-btn"]').classes()).toContain('blocked')
  })
})
