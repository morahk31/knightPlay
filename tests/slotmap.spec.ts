import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useCharactersStore } from '../src/stores/characters'
import SlotMap from '../src/components/sheet/SlotMap.vue'
import ArmorPanel from '../src/components/sheet/ArmorPanel.vue'
import ModulesPanel from '../src/components/sheet/ModulesPanel.vue'
import { memoryStorage } from './helpers'

/** Silas : Ranger avec Grappin (1 bras D), Fumigène et Pod fusées (1 torse chacun). */
function silas() {
  const store = useCharactersStore()
  store.init(memoryStorage())
  store.setArmorModel('ranger')
  store.addModule('grappin')
  store.addModule('fumigene')
  store.addModule('fusees-eclairantes')
  return store
}

describe('silhouette des slots', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('6 zones disposées en corps : Torse 2 / 6 avec ses modules, Bras D 1 / 4', () => {
    silas()
    const wrapper = mount(SlotMap)
    expect(wrapper.findAll('.slot-zone')).toHaveLength(6)
    const torse = wrapper.get('[data-testid="slot-torse"]')
    expect(torse.classes()).toContain('zone-torse')
    expect(wrapper.get('[data-testid="slot-torse-used"]').text()).toBe('2')
    expect(torse.text()).toContain('/ 6')
    expect(torse.text()).toContain('Fumigène, Pod fusées éclairantes')
    expect(wrapper.get('[data-testid="slot-brasD"]').text()).toContain('Grappin')
    expect(wrapper.find('[data-testid="slot-torse-total"]').exists()).toBe(false)
  })

  it('dépassement : zone en rouge avec « 4 / 2 »', () => {
    const store = silas()
    store.updateArmor({ slots: { ...store.active!.armure.slots, torse: 2 } })
    store.addModule('arme-torse', 1, true)
    const wrapper = mount(SlotMap)
    const torse = wrapper.get('[data-testid="slot-torse"]')
    expect(torse.classes()).toContain('over')
    expect(wrapper.get('[data-testid="slot-torse-used"]').text()).toBe('4')
    expect(torse.text()).toContain('/ 2')
  })

  it('modifiable dans l’onglet Méta-armure : total du torse saisi directement', async () => {
    const store = silas()
    const wrapper = mount(SlotMap, { props: { editable: true } })
    const total = wrapper.get('[data-testid="slot-torse-total"]')
    ;(total.element as HTMLInputElement).value = '8'
    await total.trigger('change')
    expect(store.active!.armure.slots.torse).toBe(8)
  })
})

describe('onglet Méta-armure', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('OD de base lisibles, capacités avec badge PE, évolutions en frise', () => {
    silas()
    const wrapper = mount(ArmorPanel)
    for (const k of ['deplacement', 'tir', 'discretion', 'dexterite']) {
      expect((wrapper.get(`[data-testid="armor-od-${k}"]`).element as HTMLInputElement).value).toBe('1')
    }
    const vision = wrapper.findAll('.capacity-card').find((c) => c.text().includes('La Vision'))!
    expect(vision.get('.pe-badge').text()).toBe('5 à 10 PE')
    const evolutions = wrapper.findAll('[data-testid="armor-evolutions"] li')
    expect(evolutions).toHaveLength(4)
    expect(evolutions[0]!.text()).toContain('À acheter')
    expect(wrapper.findAll('.armor-tiles .stat-tile')).toHaveLength(4)
    expect(wrapper.findAll('.armor-tiles button')).toHaveLength(0)
  })
})

describe('onglet Modules', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('modules repliés avec résumé ; déplier donne accès à l’édition', async () => {
    const store = silas()
    const wrapper = mount(ModulesPanel)
    expect(wrapper.find('[data-testid="modules-slot-summary"] .slot-map').exists()).toBe(true)
    const items = wrapper.findAll('[data-testid="module-item"]')
    expect(items).toHaveLength(3)
    expect(items[0]!.get('[data-testid="module-summary"]').text()).toBe('Niv 1 · 1 PE · 1 Bras D')
    const body = items[0]!.get('[data-testid="collapsible-body"]')
    expect(body.attributes('style')).toContain('display: none')
    await items[0]!.get('[data-testid="collapsible-toggle"]').trigger('click')
    expect(body.attributes('style') ?? '').not.toContain('display: none')
    const uid = store.active!.modules[0]!.uid
    expect(items[0]!.findAll(`[data-testid="module-${uid}-level"] option`)).toHaveLength(1)
  })
})
