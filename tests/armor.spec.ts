import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules } from '../src/config/defaultRules'
import { ARMORS, findArmor } from '../src/data/armors'
import { MODULES, findModule, moduleCostToLevel } from '../src/data/modules'
import {
  armorFromDef,
  armorStatus,
  armorTotals,
  effectiveCdf,
  effectiveOd,
  moduleFromDef,
  slotOverflow,
  slotUsage,
} from '../src/rules/armor'
import { computeDerived, gaugeTotals } from '../src/rules/derived'
import { planTest } from '../src/rules/test'
import type { Character } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import { normalizeCharacter } from '../src/stores/persistence'
import ArmorPanel from '../src/components/sheet/ArmorPanel.vue'
import ModulesPanel from '../src/components/sheet/ModulesPanel.vue'
import AspectsPanel from '../src/components/sheet/AspectsPanel.vue'
import { memoryStorage } from './helpers'

const rules = defaultRules

function withArmor(id: string): Character {
  const c = createCharacter('Test', rules)
  c.armure = armorFromDef(findArmor(id)!, rules)
  const totals = gaugeTotals(c, rules)
  c.jauges.armure.actuel = totals.armure
  c.jauges.energie.actuel = totals.energie
  return c
}

function install(c: Character, moduleId: string, niveau = 1): void {
  c.modules.push(moduleFromDef(findModule(moduleId)!, niveau, `${moduleId}-${c.modules.length}`))
}

describe('catalogues', () => {
  it('contient les 14 méta-armures du référentiel avec leurs statistiques', () => {
    expect(ARMORS).toHaveLength(14)
    expect(findArmor('rogue')).toMatchObject({ pa: 50, pe: 70, cdf: 12 })
    expect(findArmor('warrior')).toMatchObject({ pa: 100, pe: 40, cdf: 8 })
    expect(findArmor('druid')).toMatchObject({ pa: 50, pe: 80, cdf: 12 })
    expect(new Set(ARMORS.map((a) => a.id)).size).toBe(14)
  })

  it('chaque module a au moins un niveau et un coût en PG', () => {
    expect(MODULES.length).toBeGreaterThan(55)
    for (const m of MODULES) {
      expect(m.niveaux.length).toBeGreaterThan(0)
      expect(m.niveaux.every((l) => l.pg > 0)).toBe(true)
    }
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(MODULES.length)
    expect(moduleCostToLevel(findModule('course')!, 3)).toBe(70)
  })
})

describe('totaux et slots', () => {
  it('« Énergie améliorée » niveau 1 porte le total de PE d’une Rogue à 80', () => {
    const c = withArmor('rogue')
    install(c, 'energie-amelioree', 1)
    expect(armorTotals(c).pe).toBe(80)
    expect(gaugeTotals(c, rules).energie).toBe(80)
  })

  it('blindage et CdF améliorés se cumulent par niveau', () => {
    const c = withArmor('warrior')
    install(c, 'blindage-ameliore', 2)
    install(c, 'cdf-ameliore', 3)
    expect(armorTotals(c)).toMatchObject({ pa: 120, cdf: 17 })
  })

  it('« Vol » occupe les slots de chaque zone indiquée', () => {
    const c = withArmor('rogue')
    install(c, 'vol')
    const usage = slotUsage(c)
    expect(usage.jambeG.used).toBe(2)
    expect(usage.brasD.used).toBe(2)
    expect(usage.torse.used).toBe(2)
    expect(usage.tete.used).toBe(1)
    expect(usage.torse.max).toBe(8)
  })

  it('« Masse de contrôle » ajoute un slot à chaque zone', () => {
    const c = withArmor('rogue')
    install(c, 'masse-controle', 2)
    expect(armorTotals(c).slots.tete).toBe(7)
  })

  it('signale les zones en dépassement', () => {
    const c = withArmor('ranger')
    install(c, 'vol')
    install(c, 'vol')
    expect(slotOverflow(c, { torse: 3 })).toEqual(['torse'])
    expect(slotUsage(c).torse.over).toBe(false)
  })
})

describe('état de l’armure et overdrives', () => {
  it('à 0 PA, l’armure est repliée : Guardian, plus de modules ni d’OD', () => {
    const c = withArmor('warrior')
    expect(armorStatus(c)).toBe('deployee')
    expect(effectiveCdf(c, rules)).toBe(8)
    c.jauges.armure.actuel = 0
    expect(armorStatus(c)).toBe('repliee')
    expect(effectiveCdf(c, rules)).toBe(5)
    expect(effectiveOd(c, 'combat', rules)).toBe(0)
  })

  it('OD effectifs = achetés + base de l’armure', () => {
    const c = withArmor('warrior')
    c.caracs.combat.od = 1
    expect(effectiveOd(c, 'combat', rules)).toBe(2)
    expect(effectiveOd(c, 'force', rules)).toBe(0)
  })

  it('à 0 PE, les OD de l’armure ne comptent plus (règle paramétrable)', () => {
    const c = withArmor('rogue')
    c.jauges.energie.actuel = 0
    expect(effectiveOd(c, 'discretion', rules)).toBe(0)
    const house = { ...rules, armure: { ...rules.armure, odSansEnergie: true } }
    expect(effectiveOd(c, 'discretion', house)).toBe(1)
  })

  it('le type Warrior actif ajoute 1 OD (2 à 250 PG) aux 3 caractéristiques de son aspect', () => {
    const c = withArmor('warrior')
    c.armure.warriorType = 'chair'
    expect(effectiveOd(c, 'force', rules)).toBe(1)
    expect(effectiveOd(c, 'deplacement', rules)).toBe(2)
    c.progression.pgTotal = 250
    expect(effectiveOd(c, 'force', rules)).toBe(2)
  })

  it('défense et réussites automatiques utilisent les OD effectifs', () => {
    const c = withArmor('warrior')
    c.caracs.combat.val = 3
    c.derivedSource.defense = 'combat'
    expect(computeDerived(c, rules).defense.value).toBe(4)
    const plan = planTest(c, { base: 'combat', combo: 'tir', extra: null, modDes: 0, modReussites: 0, avecOd: true, desSacrifies: 0, difficulte: null }, rules)
    expect(plan.auto).toBe(2)
  })

  it('sans armure, les OD saisis sur la fiche comptent tels quels', () => {
    const c = createCharacter('Sans armure', rules)
    c.caracs.tir.od = 2
    expect(effectiveOd(c, 'tir', rules)).toBe(2)
  })
})

describe('persistance', () => {
  it('conserve l’armure, ses capacités et les modules au rechargement', () => {
    const c = withArmor('rogue')
    install(c, 'saut')
    const back = normalizeCharacter(JSON.parse(JSON.stringify(c)))!
    expect(back.armure.modele).toBe('rogue')
    expect(back.armure.capacites).toHaveLength(1)
    expect(back.modules[0]?.nom).toBe('Saut')
  })
})

describe('interface', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup() {
    const store = useCharactersStore()
    store.init(memoryStorage())
    return store
  }

  it('choisir une armure préremplit PA, PE, CdF, OD, slots et jauges, avec l’alerte « à vérifier »', async () => {
    const store = setup()
    const wrapper = mount(ArmorPanel)
    await wrapper.get('[data-testid="armor-model"]').setValue('rogue')
    expect(store.active!.armure).toMatchObject({ pa: 50, pe: 70, cdf: 12 })
    expect(store.active!.jauges.energie.actuel).toBe(70)
    expect(store.active!.jauges.armure.actuel).toBe(50)
    expect(wrapper.find('[data-testid="armor-verify"]').exists()).toBe(true)
    expect((wrapper.get('[data-testid="armor-od-discretion"]').element as HTMLInputElement).value).toBe('1')

    const pa = wrapper.get('[data-testid="armor-pa"]')
    await pa.setValue('55')
    await pa.trigger('change')
    expect(store.active!.armure.pa).toBe(55)
  })

  it('les évolutions se débloquent selon les PG totaux', async () => {
    const store = setup()
    store.setArmorModel('rogue')
    const wrapper = mount(ArmorPanel)
    expect(wrapper.findAll('[data-testid="armor-evolutions"] li.unlocked')).toHaveLength(0)
    const pg = wrapper.get('[data-testid="pg-total"]')
    await pg.setValue('200')
    await pg.trigger('change')
    expect(wrapper.findAll('[data-testid="armor-evolutions"] li.unlocked')).toHaveLength(2)
  })

  it('torse plein : ajout refusé avec alerte, puis possible en mode forcé', async () => {
    const store = setup()
    store.setArmorModel('ranger')
    store.updateArmor({ slots: { ...store.active!.armure.slots, torse: 2 } })
    const wrapper = mount(ModulesPanel)
    await wrapper.get('[data-testid="module-select"]').setValue('arme-torse')
    await wrapper.get('[data-testid="module-add"]').trigger('submit')
    expect(store.active!.modules).toHaveLength(1)
    await wrapper.get('[data-testid="module-select"]').setValue('pod-missile')
    await wrapper.get('form.add-module').trigger('submit')
    expect(store.active!.modules).toHaveLength(1)
    expect(wrapper.get('[data-testid="module-overflow"]').text()).toContain('Torse')
    await wrapper.get('[data-testid="module-force"]').trigger('click')
    expect(store.active!.modules).toHaveLength(2)
  })

  it('changer le niveau d’un module met à jour ses bonus', async () => {
    const store = setup()
    store.setArmorModel('rogue')
    store.addModule('energie-amelioree', 1)
    const uid = store.active!.modules[0]!.uid
    store.setModuleLevel(uid, 3)
    expect(gaugeTotals(store.active!, store.rules).energie).toBe(100)
  })

  it('la fiche affiche les OD effectifs quand l’armure en apporte', () => {
    const store = setup()
    store.setArmorModel('rogue')
    const wrapper = mount(AspectsPanel)
    expect(wrapper.get('[data-testid="carac-discretion-od-effectif"]').text()).toBe('OD 1')
  })
})
