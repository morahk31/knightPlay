import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules as rules } from '../src/config/defaultRules'
import { LEGEND_CHASSIS, findChassis } from '../src/data/legend'
import { checkOptimisation, legendProfile, linkedOptimisations, ROOT } from '../src/rules/legend'
import type { LegendState } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import LegendTree from '../src/components/sheet/LegendTree.vue'
import { memoryStorage } from './helpers'

function state(chassisId: string, achats: Record<string, number> = {}): LegendState {
  return { base: findChassis(chassisId)!.base, chassisId, achats }
}

describe('données des arbres', () => {
  it('8 châssis + Longbow, liens valides, au moins une optimisation reliée au châssis', () => {
    expect(LEGEND_CHASSIS).toHaveLength(9)
    for (const ch of LEGEND_CHASSIS) {
      const ids = new Set(ch.optimisations.map((o) => o.id))
      expect(ids.size, ch.id).toBe(ch.optimisations.length)
      for (const o of ch.optimisations) {
        expect(o.couts.length, `${ch.id}/${o.id}`).toBeGreaterThan(0)
        expect(o.couts.every((x) => x > 0), `${ch.id}/${o.id}`).toBe(true)
        for (const l of o.liens) expect(l === ROOT || l.startsWith('bus:') || ids.has(l), `${ch.id}/${o.id} → ${l}`).toBe(true)
      }
      expect(ch.optimisations.some((o) => o.liens.includes(ROOT)), ch.id).toBe(true)
      // Chaque optimisation est atteignable si tout est acheté (pas d'île isolée).
      const all = Object.fromEntries(ch.optimisations.map((o) => [o.id, 1]))
      expect(linkedOptimisations(ch, state(ch.id, all)).size, ch.id).toBe(ch.optimisations.length)
    }
  })

  it('coûts relevés : châssis et optimisations répétables', () => {
    expect(LEGEND_CHASSIS.map((c) => c.pg)).toEqual([10, 20, 15, 15, 10, 15, 20, 15, 0])
    const leger = findChassis('leger')!
    expect(leger.optimisations.find((o) => o.id === 'd2d6')!.couts).toEqual([15, 20, 30])
    expect(findChassis('longbow')!.optimisations.find((o) => o.id === 'd6x4')!.couts).toEqual([10, 20, 30, 40])
  })
})

describe('liens de l’arbre', () => {
  it('châssis léger : Fureur se débloque par Démoralisant ; Terrifiant par +3 violence (×3)', () => {
    const leger = findChassis('leger')!
    expect(linkedOptimisations(leger, state('leger')).has('fureur')).toBe(false)
    expect(linkedOptimisations(leger, state('leger')).has('demoralisant')).toBe(true)
    expect(linkedOptimisations(leger, state('leger', { demoralisant: 1 })).has('fureur')).toBe(true)
    expect(linkedOptimisations(leger, state('leger')).has('terrifiant')).toBe(false)
    expect(linkedOptimisations(leger, state('leger', { v3x3: 1 })).has('terrifiant')).toBe(true)
  })

  it('châssis puissant : la ligne basse s’ouvre par Anti-véhicule ou Mobile, eux-mêmes reliés à Boost 3', () => {
    const p = findChassis('puissant')!
    expect(linkedOptimisations(p, state('puissant')).has('anti-vehicule')).toBe(false)
    expect(linkedOptimisations(p, state('puissant', { boost3: 1 })).has('anti-vehicule')).toBe(true)
    expect(linkedOptimisations(p, state('puissant', { boost3: 1 })).has('fureur')).toBe(false)
    expect(linkedOptimisations(p, state('puissant', { boost3: 1, mobile: 1 })).has('fureur')).toBe(true)
  })

  it('contrôle : rareté et lien outrepassables, solde bloquant', () => {
    const c = createCharacter('Silas', rules)
    c.progression.pgSolde = 100
    const leger = findChassis('leger')!
    const fureur = leger.optimisations.find((o) => o.id === 'fureur')!
    const check = checkOptimisation(c, leger, state('leger'), fureur, rules)
    expect(check.raisons.map((r) => r.texte)).toEqual(['Rareté : 300 PG gagnés requis', 'Pas reliée à une optimisation achetée'])
    expect(check.forcable).toBe(true)
    c.progression.pgSolde = 5
    expect(checkOptimisation(c, leger, state('leger'), fureur, rules).forcable).toBe(false)
  })
})

describe('profil optimisé', () => {
  it('bonus cumulés, effet « remplace X », portée', () => {
    const p = legendProfile(findChassis('leger')!, state('leger', { d1: 1, d1x2: 2, v3: 1, assassin4: 1, assassin6: 1, 'portee-longue': 1 }))
    expect(p.degats).toEqual({ des: 6, fixe: 0 })
    expect(p.violence).toEqual({ des: 2, fixe: 3 })
    expect(p.portee).toBe('longue')
    expect(p.effets.filter((e) => e.id === 'assassin')).toEqual([{ id: 'assassin', x: 6, label: 'assassin' }])
  })

  it('« Une main » supprime deux mains ; « Mobile » supprime lourd', () => {
    expect(legendProfile(findChassis('duel')!, state('duel', { 'une-main': 1 })).effets.some((e) => e.id === 'deux-mains')).toBe(false)
    expect(legendProfile(findChassis('longbow')!, state('longbow', { mobile: 1 })).effets.some((e) => e.id === 'lourd')).toBe(false)
  })
})

describe('achats dans le store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup() {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.endMission('Mission', 0, 120)
    return store
  }

  it('lame polymorphique : châssis agile, optimisations, refus non relié puis passage outre, annulation', () => {
    const store = setup()
    store.addWeapon('lame-polymorphique')
    const uid = store.active!.armes[0]!.uid
    expect(store.active!.armes[0]!.profils.map((p) => p.nom)).toEqual(['Forme de base'])

    store.buyChassis(uid, 'agile')
    const w = () => store.active!.armes[0]!
    expect(w().legende!.chassisId).toBe('agile')
    expect(w().profils.map((p) => p.nom)).toEqual(['Forme de base', 'Optimisée'])
    expect(store.active!.progression.pgSolde).toBe(110)

    store.buyOptimisation(uid, 'd1a')
    expect(w().profils[1]!.degats.des).toBe(3)
    expect(store.active!.progression.pgSolde).toBe(105)

    expect(store.buyOptimisation(uid, 'meurtrier')!.ok).toBe(false)
    store.buyOptimisation(uid, 'meurtrier', true)
    expect(w().legende!.achats.meurtrier).toBe(1)
    expect(store.active!.progression.historique[0]!.outrepasse).toBe(true)

    store.undoTransaction()
    store.undoTransaction()
    expect(w().profils[1]!.degats.des).toBe(2)
    expect(store.active!.progression.pgSolde).toBe(110)
  })

  it('un seul châssis par arme', () => {
    const store = setup()
    store.addWeapon('pistolet-polycalibre')
    const uid = store.active!.armes[0]!.uid
    store.buyChassis(uid, 'leger')
    expect(store.buyChassis(uid, 'assaut')!.forcable).toBe(false)
  })

  it('arbre : achat d’un châssis puis d’une optimisation par clic', async () => {
    const store = setup()
    store.addWeapon('pistolet-polycalibre')
    const wrapper = mount(LegendTree, { props: { weapon: store.active!.armes[0]! } })
    await wrapper.get('[data-testid="legend-chassis-precis"]').trigger('click')
    await wrapper.setProps({ weapon: store.active!.armes[0]! })
    expect(wrapper.get('[data-testid="legend-opt-designation"]').classes()).toContain('disponible')
    await wrapper.get('[data-testid="legend-opt-designation"]').trigger('click')
    await wrapper.setProps({ weapon: store.active!.armes[0]! })
    expect(wrapper.get('[data-testid="legend-opt-designation"]').classes()).toContain('complete')
    expect(wrapper.get('[data-testid="legend-opt-silencieux"]').classes()).toContain('disponible')
    expect(wrapper.get('[data-testid="legend-opt-annihilation"]').classes()).toContain('rarete')
  })
})
