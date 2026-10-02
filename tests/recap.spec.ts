import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules as rules } from '../src/config/defaultRules'
import { findArmor } from '../src/data/armors'
import { armorFromDef } from '../src/rules/armor'
import { attackSummaries, bestCombo, recapAlerts, recapEffects } from '../src/rules/recap'
import type { Character, EffectRef } from '../src/rules/types'
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

describe('lexique des effets', () => {
  function arme(nom: string, effets: EffectRef[]): Character['armes'][number] {
    return { uid: nom, weaponId: '', nom, ameliorations: [], notes: '',
      profils: [{ nom: 'Coup', type: 'contact', degats: { des: 3, fixe: 0 }, violence: { des: 1, fixe: 0 }, portee: 'contact', effets }] }
  }

  it('une entrée par effet, avec valeurs X, armes, description et repère calculé', () => {
    const c = ranger()
    c.armes = [
      arme('Marteau', [{ id: 'meurtrier', label: 'meurtrier' }, { id: 'choc', x: 1, label: 'choc' }]),
      arme('Épée', [{ id: 'perce-armure', x: 40, label: 'perce armure' }, { id: 'meurtrier', label: 'meurtrier' }, { id: 'choc', x: 3, label: 'choc' }]),
    ]
    const effets = recapEffects(attackSummaries(c, rules))
    expect(effets.map((e) => e.id)).toEqual(['meurtrier', 'choc', 'perce-armure'])
    expect(effets[0]).toMatchObject({ armes: ['Marteau', 'Épée'], valeurs: [], calcule: true, description: '+2D6 aux dégâts si les PS sont touchés.' })
    expect(effets[1]).toMatchObject({ valeurs: [1, 3], calcule: true })
    expect(effets[1]!.description).toContain('Chair')
    expect(effets[2]).toMatchObject({ valeurs: [40], armes: ['Épée'], calcule: false })
  })

  it('effets personnalisés et non reconnus ; mains nues sans effet', () => {
    const c = ranger()
    expect(recapEffects(attackSummaries(c, rules))).toEqual([])
    c.armes = [arme('Lame', [{ id: 'saignement', label: 'saignement' }, { id: 'autre', label: 'brûlure 2' }])]
    const extra = [{ id: 'saignement', label: 'saignement', description: 'Perd 1 PS par tour.' }]
    const effets = recapEffects(attackSummaries(c, rules), extra)
    expect(effets).toEqual([
      { id: 'saignement', label: 'saignement', valeurs: [], armes: ['Lame'], description: 'Perd 1 PS par tour.', calcule: false },
      { id: 'autre', label: 'brûlure 2', valeurs: [], armes: ['Lame'], description: 'Effet personnalisé.', calcule: false },
    ])
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

  it('lexique des effets des armes, sans survol', () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    expect(mount(RecapView).find('[data-testid="recap-effects"]').exists()).toBe(false)
    store.addWeapon('shotgun-escamotable')
    const section = mount(RecapView).get('[data-testid="recap-effects"]')
    expect(section.text()).toContain('meurtrier')
    expect(section.text()).toContain('choc 1')
    expect(section.text()).toContain('+2D6 aux dégâts si les PS sont touchés.')
    expect(section.text()).toContain('calculé')
    expect(section.text()).toContain('Shotgun escamotable')
  })

  it('Retour à la fiche', async () => {
    const store = useCharactersStore()
    store.init(memoryStorage())
    const wrapper = mount(RecapView)
    await wrapper.get('[data-testid="recap-close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
