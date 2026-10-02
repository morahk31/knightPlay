import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules as rules } from '../src/config/defaultRules'
import { checkAspect, checkCarac, checkOd, checkPurchase, missionGains } from '../src/rules/progression'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import { normalizeCharacter } from '../src/stores/persistence'
import ProgressionPanel from '../src/components/sheet/ProgressionPanel.vue'
import { memoryStorage } from './helpers'

/** 20 PX, 0 PG, Combat 3, Bête 4, Chair 4. */
function setup() {
  const store = useCharactersStore()
  store.init(memoryStorage())
  store.setAspect('bete', 4)
  store.setAspect('chair', 4)
  store.setCarac('combat', 'val', 3)
  store.adjustProgression('pxActuel', 20)
  store.active!.progression.historique = []
  return store
}

describe('règles de progression', () => {
  it('fin de mission réussie, 1 secondaire, 2 parties : 13 PX (LdB p. 107)', () => {
    const gains = missionGains({ objectifAtteint: true, secondaires: 1, parties: 2, heroiques: 0, pgObjectif: 15 }, rules)
    expect(gains).toEqual({ px: 13, pg: 20 })
    expect(missionGains({ objectifAtteint: false, secondaires: 0, parties: 1, heroiques: 1, pgObjectif: 15 }, rules)).toEqual({ px: 5, pg: 5 })
  })

  it('coûts : Combat 3 → 4 = 8 PX, Chair 4 → 5 = 25 PX, OD 1 → 2 = 30 PG', () => {
    const c = createCharacter('Gauvain', rules)
    c.aspects.bete = 4
    c.aspects.chair = 4
    c.caracs.combat.val = 3
    c.caracs.tir.od = 1
    expect(checkCarac(c, 'combat', rules)).toMatchObject({ cout: 8, de: 3, vers: 4 })
    expect(checkAspect(c, 'chair', rules)).toMatchObject({ cout: 25, de: 4, vers: 5 })
    expect(checkOd(c, 'tir', rules)).toMatchObject({ cout: 30, de: 1, vers: 2, devise: 'PG' })
  })

  it('les OD de base de l’armure comptent ; au-delà du niveau 2, 300 PG gagnés', () => {
    const c = createCharacter('Gauvain', rules)
    c.armure = { ...c.armure, modele: 'warrior', od: { combat: 2 } }
    c.progression.pgSolde = 100
    const check = checkOd(c, 'combat', rules)
    expect(check).toMatchObject({ de: 2, vers: 3, cout: 50, forcable: true })
    expect(check.raisons[0]!.texte).toContain('300 PG')
  })

  it('paliers : un module avancé exige 100 PG gagnés', () => {
    const c = createCharacter('Gauvain', rules)
    c.progression.pgTotal = 80
    c.progression.pgSolde = 80
    const check = checkPurchase(c, 'Adhérence', 20, 'avance', rules)
    expect(check.ok).toBe(false)
    expect(check.raisons[0]!.texte).toContain('100 PG')
    c.progression.pgTotal = 100
    expect(checkPurchase(c, 'Adhérence', 20, 'avance', rules).ok).toBe(true)
  })

  it('PX insuffisants : refus non outrepassable', () => {
    const c = createCharacter('Gauvain', rules)
    c.aspects.chair = 4
    expect(checkAspect(c, 'chair', rules)).toMatchObject({ ok: false, forcable: false })
  })
})

describe('store et historique', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('+1 Combat : 8 PX, historique, puis annulation exacte', () => {
    const store = setup()
    store.buyCarac('combat')
    expect(store.active!.caracs.combat.val).toBe(4)
    expect(store.active!.progression.pxActuel).toBe(12)
    expect(store.active!.progression.historique[0]).toMatchObject({ kind: 'carac', libelle: 'Combat 3 → 4', px: -8 })
    store.undoTransaction()
    expect(store.active!.caracs.combat.val).toBe(3)
    expect(store.active!.progression.pxActuel).toBe(20)
    expect(store.active!.progression.historique).toHaveLength(0)
  })

  it('fin de mission : PX et PG actuels et totaux, l’aspect redevient augmentable', () => {
    const store = setup()
    store.adjustProgression('pxActuel', 60)
    store.buyAspect('chair')
    expect(checkAspect(store.active!, 'chair', rules).raisons.map((r) => r.texte)).toContain('Un aspect ne monte qu’une fois par mission')
    store.endMission('Mission « Arche »', 13, 20)
    const p = store.active!.progression
    expect(p).toMatchObject({ pxActuel: 35 + 13, pxTotal: 13, pgSolde: 20, pgTotal: 20, aspectsMission: [] })
  })

  it('OD acheté en PG : solde −30, total inchangé', () => {
    const store = setup()
    store.setCarac('tir', 'od', 1)
    store.endMission('Mission', 0, 60)
    store.buyOd('tir')
    expect(store.active!.caracs.tir.od).toBe(2)
    expect(store.active!.progression).toMatchObject({ pgSolde: 30, pgTotal: 60 })
  })

  it('module acheté : installé et payé ; refus sous le palier', () => {
    const store = setup()
    store.setArmorModel('rogue')
    store.endMission('Mission', 0, 80)
    expect(store.buyModule('adherence', 1)!.ok).toBe(false)
    expect(store.active!.modules).toHaveLength(0)
    store.buyModule('saut', 2)
    expect(store.active!.modules[0]).toMatchObject({ moduleId: 'saut', niveau: 2 })
    expect(store.active!.progression.pgSolde).toBe(50)
    store.undoTransaction()
    expect(store.active!.modules).toHaveLength(0)
    expect(store.active!.progression.pgSolde).toBe(80)
  })

  it('arme achetée : rangée dans le rack', () => {
    const store = setup()
    store.endMission('Mission', 0, 40)
    store.buyWeapon('epee-batarde')
    expect(store.active!.armes[0]!.nom).toBe('Épée bâtarde')
    expect(store.active!.progression.pgSolde).toBe(10)
  })

  it('l’historique est sauvegardé avec la fiche', () => {
    const store = setup()
    store.buyCarac('combat')
    const back = normalizeCharacter(JSON.parse(JSON.stringify(store.active)))!
    expect(back.progression.historique).toHaveLength(1)
    expect(back.progression.historique[0]!.avant.caracs.combat.val).toBe(3)
  })
})

describe('onglet Progression', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('coût affiché, achat, puis annulation depuis l’historique', async () => {
    const store = setup()
    const wrapper = mount(ProgressionPanel)
    const btn = wrapper.get('[data-testid="up-carac-combat"]')
    expect(btn.text()).toBe('+1 · 8 PX')
    await btn.trigger('click')
    expect(store.active!.progression.pxActuel).toBe(12)
    expect(wrapper.findAll('[data-testid="history-item"]')[0]!.text()).toContain('Combat 3 → 4')
    await wrapper.get('[data-testid="history-undo"]').trigger('click')
    expect(store.active!.caracs.combat.val).toBe(3)
    expect(store.active!.progression.pxActuel).toBe(20)
  })

  it('plafond d’aspect : refus avec raison, puis passage outre', async () => {
    const store = setup()
    store.setCarac('combat', 'val', 4)
    const wrapper = mount(ProgressionPanel)
    await wrapper.get('[data-testid="up-carac-combat"]').trigger('click')
    expect(store.active!.caracs.combat.val).toBe(4)
    expect(wrapper.get('[data-testid="prog-refus"]').text()).toContain('Dépasse l’aspect Bête (4)')
    await wrapper.get('[data-testid="prog-outrepasser"]').trigger('click')
    expect(store.active!.caracs.combat.val).toBe(5)
    expect(store.active!.progression.pxActuel).toBe(10)
    expect(store.active!.progression.historique[0]!.outrepasse).toBe(true)
  })

  it('assistant de fin de mission : 13 PX proposés, modifiables, validés', async () => {
    const store = setup()
    const wrapper = mount(ProgressionPanel)
    await wrapper.get('[data-testid="mission-secondaires"]').setValue('1')
    await wrapper.get('[data-testid="mission-parties"]').setValue('2')
    expect((wrapper.get('[data-testid="mission-px"]').element as HTMLInputElement).value).toBe('13')
    await wrapper.get('[data-testid="mission-pg"]').setValue('18')
    await wrapper.get('[data-testid="mission-valider"]').trigger('click')
    expect(store.active!.progression).toMatchObject({ pxActuel: 33, pgSolde: 18, pgTotal: 18 })
  })
})
