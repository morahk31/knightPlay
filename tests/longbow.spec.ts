import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules as rules } from '../src/config/defaultRules'
import { findArmor } from '../src/data/armors'
import { armorFromDef } from '../src/rules/armor'
import { EMPTY_SHOT, longbowCaps, longbowCost, longbowProfile, shotProfile } from '../src/rules/longbow'
import type { Character, OwnedWeapon } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import AttackPanel from '../src/components/actions/AttackPanel.vue'
import { facesRng, memoryStorage } from './helpers'

const LDB: OwnedWeapon = { uid: 'lb', weaponId: 'longbow', nom: 'Longbow', profils: [], ameliorations: [], notes: '' }
const ARSENAL = (achats: Record<string, number> = {}): OwnedWeapon => ({
  uid: 'lba', weaponId: 'longbow-arsenal', nom: 'Longbow', profils: [], ameliorations: [], notes: '',
  legende: { base: 'longbow', chassisId: 'longbow', achats },
})

function ranger(evolutions: string[] = []): Character {
  const c = createCharacter('Silas', rules)
  c.armure = armorFromDef(findArmor('ranger')!, rules)
  for (const e of c.armure.evolutions) if (e.id && evolutions.includes(e.id)) e.possedee = true
  return c
}

describe('Longbow du livre de base', () => {
  it('profil de base 3D6 / 1D6, lourd ; évolutions : 5D6 / 3D6, +9D6, plus de lourd', () => {
    const base = longbowProfile(ranger(), LDB)!
    expect(base).toMatchObject({ degats: { des: 3, fixe: 0 }, violence: { des: 1, fixe: 0 }, portee: 'moyenne' })
    expect(base.effets.map((e) => e.id)).toEqual(['lourd', 'deux-mains', 'assistance'])
    expect(longbowCaps(ranger(), LDB)).toMatchObject({ boostMax: 6, majeurs: false, economie: false })
    const evolue = ranger(['longbow-profil', 'longbow-mobile'])
    expect(longbowProfile(evolue, LDB)).toMatchObject({ degats: { des: 5, fixe: 0 }, violence: { des: 3, fixe: 0 } })
    expect(longbowProfile(evolue, LDB)!.effets.some((e) => e.id === 'lourd')).toBe(false)
    expect(longbowCaps(evolue, LDB)!.boostMax).toBe(9)
  })

  it('coût d’un tir : boost 3 + portée 1 + 2 effets à 2 PE + 1 effet à 3 PE = 11 PE ; Économie : 7 PE', () => {
    const shot = { ...EMPTY_SHOT, boost: 3, portee: 1, mineurs: ['silencieux', 'choc 1'], intermediaires: ['lumière 4'] }
    expect(longbowCost(shot, longbowCaps(ranger(), LDB)!).pe).toBe(11)
    expect(longbowCost(shot, longbowCaps(ranger(['longbow-economie']), LDB)!).pe).toBe(3 + 1 + 1 + 1 + 1)
  })

  it('limites : 3 effets par liste, boost plafonné, effets majeurs à acheter', () => {
    const caps = longbowCaps(ranger(), LDB)!
    expect(longbowCost({ ...EMPTY_SHOT, mineurs: ['silencieux', 'choc 1', 'ultraviolence', 'désignation'] }, caps).erreurs).toHaveLength(1)
    expect(longbowCost({ ...EMPTY_SHOT, boost: 7 }, caps).erreurs[0]).toContain('6D6')
    expect(longbowCost({ ...EMPTY_SHOT, majeurs: ['fureur'] }, caps).erreurs[0]).toContain('majeurs')
  })

  it('profil du tir : effets ajoutés et portée augmentée', () => {
    const p = shotProfile(longbowProfile(ranger(), LDB)!, { ...EMPTY_SHOT, portee: 2, intermediaires: ['perce armure 60'] })
    expect(p.portee).toBe('lointaine')
    expect(p.effets.find((e) => e.id === 'perce-armure')!.x).toBe(60)
  })
})

describe('Longbow de l’arsenal de légende', () => {
  it('Boost 9 puis 14, effets majeurs et Économie achetés dans l’arbre', () => {
    expect(longbowCaps(ranger(), ARSENAL())).toMatchObject({ mode: 'arsenal', boostMax: 9, majeurs: false })
    expect(longbowCaps(ranger(), ARSENAL({ boost14: 1, 'effets-majeurs': 1, economie: 1 }))).toMatchObject({ boostMax: 14, majeurs: true, economie: true })
    const p = longbowProfile(ranger(), ARSENAL({ chirurgical: 1, precision: 1 }))!
    expect(p.effets.map((e) => e.id)).toEqual(expect.arrayContaining(['fatal', 'chirurgical', 'precision', 'assistance']))
  })
})

describe('tir au Longbow depuis le panneau Attaque', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup(faces: number[]) {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.setArmorModel('ranger')
    store.setCarac('tir', 'val', 3)
    store.addWeapon('longbow')
    const wrapper = mount(AttackPanel, { props: { rng: facesRng(faces) } })
    return { store, wrapper }
  }

  it('boost 2 + silencieux : 4 PE dépensés, 2D6 de boost dans les dégâts', async () => {
    const { store, wrapper } = setup([2, 4, 1, 1, 3, 3, 3, 3, 3, 2])
    await wrapper.get('[data-testid="attack-weapon"]').setValue(store.active!.armes[0]!.uid)
    await wrapper.get('[data-testid="longbow-boost"]').setValue('2')
    await wrapper.get('[data-testid="longbow-silencieux"]').setValue(true)
    expect(wrapper.get('[data-testid="longbow"]').text()).toContain('4 PE')
    await wrapper.get('[data-testid="attack-roll"]').trigger('click')
    expect(store.active!.jauges.energie.actuel).toBe(70 - 4)
    await wrapper.get('[data-testid="attack-damage"]').trigger('click')
    expect(wrapper.get('[data-testid="attack-damage-result"]').text()).toContain('5D6')
    expect(store.active!.journal.some((e) => e.detail.includes('−4 PE'))).toBe(true)
  })

  it('énergie insuffisante : tir refusé, rien n’est dépensé', async () => {
    const { store, wrapper } = setup([2])
    store.setGauge('energie', 1)
    await wrapper.get('[data-testid="attack-weapon"]').setValue(store.active!.armes[0]!.uid)
    await wrapper.get('[data-testid="longbow-boost"]').setValue('3')
    await wrapper.get('[data-testid="attack-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="attack-error"]').text()).toMatch(/insuffisante/)
    expect(store.active!.jauges.energie.actuel).toBe(1)
    expect(wrapper.find('[data-testid="roll-result"]').exists()).toBe(false)
  })

  it('évolution de la Ranger achetée en PG, annulable', () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.setArmorModel('ranger')
    store.endMission('Mission', 0, 60)
    const index = store.active!.armure.evolutions.findIndex((e) => e.id === 'longbow-profil')
    store.buyEvolution(index)
    expect(store.active!.armure.evolutions[index]!.possedee).toBe(true)
    expect(store.active!.progression.pgSolde).toBe(10)
    store.undoTransaction()
    expect(store.active!.armure.evolutions[index]!.possedee).toBeFalsy()
    expect(store.active!.progression.pgSolde).toBe(60)
  })
})
