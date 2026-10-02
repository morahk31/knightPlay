import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules as rules } from '../src/config/defaultRules'
import { findArmor } from '../src/data/armors'
import { armorFromDef } from '../src/rules/armor'
import { attackSummaries, bestCombo, recapAlerts } from '../src/rules/recap'
import type { Character } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import RecapView from '../src/components/RecapView.vue'
import { memoryStorage } from './helpers'

function ranger(): Character {
  const c = createCharacter('Silas', rules)
  c.aspects.machine = 5
  c.caracs.tir = { val: 5, od: 0 }
  c.caracs.technique = { val: 5, od: 0 }
  c.armure = armorFromDef(findArmor('ranger')!, rules)
  c.jauges.armure.actuel = 50
  c.jauges.energie.actuel = 70
  return c
}

describe('synthèse', () => {
  it('alertes selon l’état : désespoir, agonie, armure repliée, plus d’énergie', () => {
    const c = ranger()
    expect(recapAlerts(c, rules)).toEqual([])
    c.jauges.espoir.actuel = 7
    c.jauges.sante.actuel = 0
    expect(recapAlerts(c, rules).map((a) => a.titre)).toEqual(['Agonie', 'Désespoir'])
    expect(recapAlerts(c, rules)[1]!.texte).toContain('−3 dés')
    c.jauges.energie.actuel = 0
    expect(recapAlerts(c, rules).map((a) => a.titre)).toContain('Plus d’énergie')
    c.jauges.armure.actuel = 0
    expect(recapAlerts(c, rules).map((a) => a.titre)).toContain('Armure repliée')
  })

  it('meilleure combo et attaques prêtes à lancer (style et désespoir compris)', () => {
    const c = ranger()
    expect(bestCombo(c, 'tir', rules)).toBe('technique')
    c.armes = [{ uid: 'f', weaponId: 'fusil-precision', nom: 'Fusil de précision', ameliorations: [], notes: '',
      profils: [{ nom: 'Tir', type: 'distance', degats: { des: 4, fixe: 6 }, violence: { des: 1, fixe: 0 }, portee: 'lointaine', effets: [{ id: 'precision', label: 'précision' }] }] }]
    const [fusil, mains] = attackSummaries(c, rules)
    // Tir 5 + Technique 5, OD de Tir de la Ranger : 1 auto.
    expect(fusil).toMatchObject({ arme: 'Fusil de précision', base: 'tir', combo: 'technique', des: 10, auto: 1 })
    expect(fusil!.degats).toBe('4D6 + 6 Arme + 6 Précision (Tir + OD)')
    expect(mains!.arme).toBe('Mains nues')
    c.jauges.espoir.actuel = 8
    c.combat.style = 'agressif'
    expect(attackSummaries(c, rules)[0]!.des).toBe(10 - 2 + 3)
  })

  it('Longbow : note de coût en PE', () => {
    const c = ranger()
    c.armes = [{ uid: 'lb', weaponId: 'longbow', nom: 'Longbow', profils: [], ameliorations: [], notes: '' }]
    expect(attackSummaries(c, rules)[0]!.longbow).toContain('6 max')
  })
})

describe('page Récap', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('affiche jauges, défenses, attaques, capacités, OD et rappels', () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.setArmorModel('ranger')
    store.setGauge('espoir', 5)
    const wrapper = mount(RecapView)
    expect(wrapper.get('[data-testid="recap-gauge-energie"]').text()).toContain('70')
    expect(wrapper.get('[data-testid="recap-alerts"]').text()).toContain('Désespoir')
    expect(wrapper.get('[data-testid="recap-armor"]').text()).toContain('Ranger')
    expect(wrapper.get('[data-testid="recap-attacks"]').text()).toContain('Mains nues')
    expect(wrapper.get('[data-testid="recap-capacities"]').text()).toContain('La Vision')
    expect(wrapper.get('[data-testid="recap-od"]').text()).toContain('Déplacement 1')
    expect(wrapper.text()).toContain('Rappels de règles')
  })

  it('Retour à la fiche', async () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    const wrapper = mount(RecapView)
    await wrapper.get('[data-testid="recap-close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
