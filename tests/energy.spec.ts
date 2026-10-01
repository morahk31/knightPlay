import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules } from '../src/config/defaultRules'
import { findArmor } from '../src/data/armors'
import { armorFromDef } from '../src/rules/armor'
import { gaugeTotals } from '../src/rules/derived'
import { foldRestEnergy, resetNods, restEnergy, spendEnergy, useNod } from '../src/rules/energy'
import type { Character } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import EnergyPanel from '../src/components/actions/EnergyPanel.vue'
import { facesRng, memoryStorage } from './helpers'

const rules = defaultRules

function rogue(): Character {
  const c = createCharacter('Rogue', rules)
  c.armure = armorFromDef(findArmor('rogue')!, rules)
  c.jauges.armure.actuel = 50
  c.jauges.energie.actuel = 70
  return c
}

describe('énergie', () => {
  it('dépense les PE d’une activation', () => {
    const c = rogue()
    expect(spendEnergy(c, 2)).toEqual({ ok: true, amount: 2 })
    expect(c.jauges.energie.actuel).toBe(68)
  })

  it('refuse une activation sans PE suffisants', () => {
    const c = rogue()
    c.jauges.energie.actuel = 1
    const result = spendEnergy(c, 3)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/insuffisante/)
    expect(c.jauges.energie.actuel).toBe(1)
  })

  it('refuse une activation quand l’armure est repliée', () => {
    const c = rogue()
    c.armure.etat = 'repliee'
    expect(spendEnergy(c, 2).ok).toBe(false)
  })

  it('nod d’énergie : +valeur sans dépasser le total, un nod de moins', () => {
    const c = rogue()
    c.jauges.energie.actuel = 50
    expect(useNod(c, 'energie', 11, { sante: 16 })).toMatchObject({ ok: true, amount: 11 })
    expect(c.jauges.energie.actuel).toBe(61)
    useNod(c, 'energie', 18, { sante: 16 })
    expect(c.jauges.energie.actuel).toBe(70)
    expect(c.armure.nods.energie).toBe(1)
  })

  it('nods d’armure et de soin, refus quand il n’en reste plus', () => {
    const c = rogue()
    c.jauges.armure.actuel = 40
    c.jauges.sante.actuel = 10
    useNod(c, 'armure', 7, { sante: 16 })
    useNod(c, 'soin', 9, { sante: 16 })
    expect(c.jauges.armure.actuel).toBe(47)
    expect(c.jauges.sante.actuel).toBe(16)
    c.armure.nods.soin = 0
    expect(useNod(c, 'soin', 5, { sante: 16 }).ok).toBe(false)
    resetNods(c, rules)
    expect(c.armure.nods).toEqual({ energie: 3, armure: 3, soin: 3 })
  })

  it('repos : +6 PE par heure, repli de 6 h = plein', () => {
    const c = rogue()
    c.jauges.energie.actuel = 10
    expect(restEnergy(c, 2, rules).amount).toBe(12)
    expect(c.jauges.energie.actuel).toBe(22)
    foldRestEnergy(c)
    expect(c.jauges.energie.actuel).toBe(70)
  })

  it('la Sorcerer ne recharge pas au repos', () => {
    const c = createCharacter('Sorcerer', rules)
    c.armure = armorFromDef(findArmor('sorcerer')!, rules)
    c.jauges.energie.actuel = 10
    expect(restEnergy(c, 3, rules).ok).toBe(false)
    expect(foldRestEnergy(c).ok).toBe(false)
    expect(c.jauges.energie.actuel).toBe(10)
  })
})

describe('panneau énergie', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup(faces?: number[]) {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.setArmorModel('rogue')
    const wrapper = mount(EnergyPanel, { props: { rng: faces ? facesRng(faces) : undefined } })
    return { store, wrapper }
  }

  it('activer le mode Ghost (2 PE) : 70 → 68, journalisé', async () => {
    const { store, wrapper } = setup()
    await wrapper.get('[data-testid="activate-cap-ghost"]').trigger('click')
    expect(store.active!.jauges.energie.actuel).toBe(68)
    expect(store.active!.journal[0]!.title).toContain('Mode Ghost')
  })

  it('refuse une activation à 1 PE et l’explique', async () => {
    const { store, wrapper } = setup()
    store.setGauge('energie', 1)
    store.addModule('saut')
    await wrapper.vm.$nextTick()
    const key = `mod-${store.active!.modules[0]!.uid}`
    await wrapper.get(`[data-testid="activate-${key}"]`).trigger('click')
    expect(store.active!.jauges.energie.actuel).toBe(1)
    expect(wrapper.get('[data-testid="energy-message"]').classes()).toContain('error')
  })

  it('nod d’énergie lancé (3D6 = 11) : +11 PE', async () => {
    const { store, wrapper } = setup([4, 4, 3])
    store.setGauge('energie', 40)
    await wrapper.get('[data-testid="nod-energie"]').trigger('click')
    expect(store.active!.jauges.energie.actuel).toBe(51)
    expect(store.active!.armure.nods.energie).toBe(2)
  })

  it('nod avec valeur saisie (vrais dés)', async () => {
    const { store, wrapper } = setup()
    store.setGauge('energie', 40)
    await wrapper.get('[data-testid="nod-value"]').setValue('15')
    await wrapper.get('[data-testid="nod-energie"]').trigger('click')
    expect(store.active!.jauges.energie.actuel).toBe(55)
  })

  it('Warrior : activer un type coûte 1 PE et donne les OD', async () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.setArmorModel('warrior')
    const wrapper = mount(EnergyPanel)
    await wrapper.get('[data-testid="warrior-type-select"]').setValue('bete')
    await wrapper.get('[data-testid="warrior-type-activate"]').trigger('click')
    expect(store.active!.armure.warriorType).toBe('bete')
    expect(store.active!.jauges.energie.actuel).toBe(gaugeTotals(store.active!, store.rules).energie - 1)
  })
})
