import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules as rules } from '../src/config/defaultRules'
import { findArmor } from '../src/data/armors'
import { armorFromDef } from '../src/rules/armor'
import { NO_EFFECTS, soak, type IncomingHit } from '../src/rules/soak'
import type { Character } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import SoakPanel from '../src/components/actions/SoakPanel.vue'
import { facesRng, memoryStorage } from './helpers'

/** Méta-armure déployée : 50 PA, CdF 10, 20 PS. */
function knight(): Character {
  const c = createCharacter('Perceval', rules)
  c.armure = { ...armorFromDef(findArmor('warrior')!, rules), pa: 50, cdf: 10 }
  c.jauges.armure.actuel = 50
  c.jauges.sante = { actuel: 20, total: 20 }
  return c
}

function hit(degats: number, extra: Partial<IncomingHit> = {}): IncomingHit {
  return { degats, ...NO_EFFECTS, ...extra }
}

describe('ordre d’encaissement', () => {
  it('12 dégâts contre CdF 10 : 2 sur les PA, aucun PS perdu', () => {
    const r = soak(knight(), hit(12), rules)
    expect(r).toMatchObject({ cdf: 10, apresCdf: 2, paPerdus: 2, psTranches: 0, psPerdus: 0 })
  })

  it('17 dégâts : 7 sur les PA → −1 PS (tranche de 5)', () => {
    const r = soak(knight(), hit(17), rules)
    expect(r).toMatchObject({ paPerdus: 7, psTranches: 1, psPerdus: 1 })
    expect(r.after).toMatchObject({ armure: 43, sante: 19 })
  })

  it('pénétrant 10 contre CdF 10, 25 dégâts : 25 sur les PA, −5 PS', () => {
    const r = soak(knight(), hit(25, { penetrant: 10 }), rules)
    expect(r).toMatchObject({ cdf: 0, paPerdus: 25, psTranches: 5, psPerdus: 5 })
  })

  it('ignore CdF ; bonus de CdF ajouté', () => {
    expect(soak(knight(), hit(12, { ignoreCdf: true }), rules).paPerdus).toBe(12)
    expect(soak(knight(), hit(12, { bonusCdf: 2 }), rules).paPerdus).toBe(0)
  })

  it('PA à 3, 20 dégâts après CdF (Guardian) : 3 PA, repliée, 5 sur la Guardian, 12 PS', () => {
    const c = knight()
    c.jauges.armure.actuel = 3
    const r = soak(c, hit(30), rules)
    expect(r).toMatchObject({ apresCdf: 20, paPerdus: 3, replie: true, guardianPerdus: 5, psDegats: 12, psPerdus: 12 })
    expect(r.after).toMatchObject({ armure: 0, guardianPa: 0, sante: 8, etat: 'repliee' })
  })

  it('même cas avec la règle du livre (excédent aux PS) : 17 PS', () => {
    const c = knight()
    c.jauges.armure.actuel = 3
    const ldb = { ...rules, encaissement: { ...rules.encaissement, excedentApresPa: 'ps' as const } }
    expect(soak(c, hit(30), ldb)).toMatchObject({ guardianPerdus: 0, psPerdus: 17 })
  })

  it('armure repliée : CdF 5 de la Guardian, puis ses PA, puis les PS', () => {
    const c = knight()
    c.armure.etat = 'repliee'
    const r = soak(c, hit(14), rules)
    expect(r).toMatchObject({ cdf: 5, guardianPerdus: 5, psPerdus: 4, paPerdus: 0 })
  })

  it('ignore armure, 15 dégâts après CdF : 15 PS, PA intacts', () => {
    const r = soak(knight(), hit(25, { ignoreArmure: true }), rules)
    expect(r).toMatchObject({ paIgnores: true, paPerdus: 0, psPerdus: 15 })
  })

  it('perce armure 40 contre 30 PA, 14 dégâts : 14 PS', () => {
    const c = knight()
    c.jauges.armure.actuel = 30
    expect(soak(c, hit(24, { perceArmure: 40 }), rules)).toMatchObject({ paIgnores: true, psPerdus: 14 })
    c.jauges.armure.actuel = 41
    expect(soak(c, hit(24, { perceArmure: 40 }), rules).paIgnores).toBe(false)
  })

  it('Infatigable : pas de PS perdus par tranches', () => {
    const c = knight()
    c.avantages = ['Infatigable']
    expect(soak(c, hit(25, { penetrant: 10 }), rules).psPerdus).toBe(0)
  })

  it('4ᵉ génération : pas de PS, ignore armure touche les PA, agonie à 0 PA', () => {
    const c = createCharacter('Morgane', rules)
    c.armure = armorFromDef(findArmor('sorcerer')!, rules)
    c.jauges.armure.actuel = 10
    const cdf = c.armure.cdf
    const r = soak(c, hit(cdf + 15, { ignoreArmure: true }), rules)
    expect(r).toMatchObject({ paIgnores: false, paPerdus: 10, psPerdus: 0, agonie: true })
  })

  it('Anathème : l’espoir encaisse après le CdF (Esprit d’acier −1) ; drain : l’énergie', () => {
    const c = knight()
    c.avantages = ['Esprit d’acier']
    expect(soak(c, hit(16, { cible: 'espoir' }), rules)).toMatchObject({ espoirPerdu: 5, paPerdus: 0 })
    c.jauges.energie.actuel = 3
    expect(soak(c, hit(16, { cible: 'energie' }), rules)).toMatchObject({ energiePerdue: 3 })
  })

  it('sans méta-armure : PA saisis à la main, pas de CdF ni de Guardian', () => {
    const c = createCharacter('Civil', rules)
    c.jauges.armure = { actuel: 4, total: 4 }
    const r = soak(c, hit(10), rules)
    expect(r).toMatchObject({ cdf: 0, paPerdus: 4, replie: false, guardianPerdus: 0, psPerdus: 6 })
  })
})

describe('panneau Encaisser', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup() {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.setArmorModel('warrior')
    store.updateArmor({ cdf: 10 })
    return store
  }

  it('aperçu avant validation, application, journal puis annulation exacte', async () => {
    const store = setup()
    const before = JSON.parse(JSON.stringify({ jauges: store.active!.jauges, armure: store.active!.armure }))
    const wrapper = mount(SoakPanel)
    await wrapper.get('[data-testid="soak-degats"]').setValue('17')
    expect(wrapper.get('[data-testid="soak-preview"]').text()).toBe('CdF −10 → 7 dégâts après CdF → PA −7 → −1 PS (tranches de 5 PA)')
    expect(store.active!.jauges.armure.actuel).toBe(100)

    await wrapper.get('[data-testid="soak-apply"]').trigger('click')
    expect(store.active!.jauges.armure.actuel).toBe(93)
    expect(store.active!.jauges.sante.actuel).toBe(15)
    expect(store.active!.journal[0]!.title).toBe('Encaisser')

    await wrapper.get('[data-testid="soak-undo"]').trigger('click')
    expect({ jauges: store.active!.jauges, armure: store.active!.armure }).toEqual(before)
    expect((wrapper.get('[data-testid="soak-undo"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('jet de dégâts virtuel (3D6+6)', async () => {
    setup()
    const wrapper = mount(SoakPanel, { props: { rng: facesRng([4, 5, 6]) } })
    await wrapper.get('[data-testid="soak-jet"]').setValue('3D6+6')
    await wrapper.get('[data-testid="soak-roll"]').trigger('click')
    expect((wrapper.get('[data-testid="soak-degats"]').element as HTMLInputElement).value).toBe('21')
  })

  it('PS à 0 : alerte d’agonie, puis 1 point d’héroïsme pour rester à 1 PS', async () => {
    const store = setup()
    store.setGauge('heroisme', 1)
    const wrapper = mount(SoakPanel)
    await wrapper.get('[data-testid="soak-ignore-armure"]').setValue(true)
    await wrapper.get('[data-testid="soak-degats"]').setValue('60')
    await wrapper.get('[data-testid="soak-apply"]').trigger('click')
    expect(store.active!.jauges.sante.actuel).toBe(0)
    expect(wrapper.get('[data-testid="soak-agonie"]').text()).toContain('Agonie')
    await wrapper.get('[data-testid="soak-heroisme"]').trigger('click')
    expect(store.active!.jauges.sante.actuel).toBe(1)
    expect(store.active!.jauges.heroisme.actuel).toBe(0)
    expect(wrapper.find('[data-testid="soak-agonie"]').exists()).toBe(false)
  })
})
