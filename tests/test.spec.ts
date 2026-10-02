import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { defaultRules } from '../src/config/defaultRules'
import {
  describeResult,
  planTest,
  resolveFromCount,
  resolveFromFaces,
  type TestInput,
} from '../src/rules/test'
import type { Character, RulesConfig } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import { useRulesStore } from '../src/stores/rules'
import { useLogStore } from '../src/stores/log'
import TestPanel from '../src/components/actions/TestPanel.vue'
import LogPanel from '../src/components/LogPanel.vue'
import { facesRng, memoryStorage } from './helpers'

const rules = defaultRules

function input(partial: Partial<TestInput>): TestInput {
  return {
    base: 'deplacement',
    combo: null,
    extra: null,
    modDes: 0,
    modReussites: 0,
    avecOd: true,
    desSacrifies: 0,
    difficulte: null,
    ...partial,
  }
}

/** Personnage de l'exemple du livre : Déplacement 4 (OD 2), Force 3 (OD 1). */
function nicolas(): Character {
  const c = createCharacter('Nicolas', rules)
  c.caracs.deplacement = { val: 4, od: 2 }
  c.caracs.force = { val: 3, od: 1 }
  return c
}

describe('planification', () => {
  it('pool = base + combo, réussites auto = OD des deux (LdB p. 77)', () => {
    const plan = planTest(nicolas(), input({ combo: 'force', difficulte: 5 }), rules)
    expect(plan.des).toBe(7)
    expect(plan.auto).toBe(3)
    expect(plan.erreurs).toEqual([])
  })

  it('refuse une combo identique à la base', () => {
    const plan = planTest(nicolas(), input({ combo: 'deplacement' }), rules)
    expect(plan.erreurs).toHaveLength(1)
    expect(plan.chance).toBeNull()
  })

  it('3ᵉ caractéristique (héroïsme) ajoutée avec ses OD', () => {
    const c = nicolas()
    c.caracs.hargne = { val: 2, od: 1 }
    const plan = planTest(c, input({ combo: 'force', extra: 'hargne' }), rules)
    expect(plan.des).toBe(9)
    expect(plan.auto).toBe(4)
  })

  it('modificateurs de dés et de réussites, OD désactivables', () => {
    const plan = planTest(nicolas(), input({ combo: 'force', modDes: 3, modReussites: 1, avecOd: false }), rules)
    expect(plan.des).toBe(10)
    expect(plan.auto).toBe(1)
  })

  it('espoir à 8 : un pool de 8 dés passe à 6 (LdB p. 97)', () => {
    const c = createCharacter('Désespéré', rules)
    c.caracs.combat.val = 4
    c.caracs.force.val = 4
    c.jauges.espoir.actuel = 8
    const plan = planTest(c, input({ base: 'combat', combo: 'force' }), rules)
    expect(plan.malusEspoir).toBe(2)
    expect(plan.des).toBe(6)
  })

  it('sacrifice de dés par paires, seulement si la règle optionnelle est active', () => {
    const off = planTest(nicolas(), input({ combo: 'force', desSacrifies: 4 }), rules)
    expect(off.des).toBe(7)
    const on: RulesConfig = { ...rules, systeme: { ...rules.systeme, sacrificeDes: true } }
    const plan = planTest(nicolas(), input({ combo: 'force', desSacrifies: 5 }), on)
    expect(plan.desSacrifies).toBe(4)
    expect(plan.des).toBe(3)
    expect(plan.auto).toBe(5)
  })
})

describe('résolution', () => {
  it('exemple LdB p. 77 : 3 pairs sur 7 + 3 OD = 6, réussi contre Ardu (5)', () => {
    const plan = planTest(nicolas(), input({ combo: 'force', difficulte: 5 }), rules)
    const r = resolveFromFaces(plan, [2, 4, 6, 1, 3, 5, 1], null, rules)
    expect(r.total).toBe(6)
    expect(r.reussi).toBe(true)
  })

  it('il faut dépasser la difficulté, pas l’égaler', () => {
    const plan = planTest(nicolas(), input({ combo: 'force', difficulte: 6 }), rules)
    expect(resolveFromFaces(plan, [2, 4, 6, 1, 3, 5, 1], null, rules).reussi).toBe(false)
  })

  it('échec critique : aucun dé pair, raté malgré les OD', () => {
    const plan = planTest(nicolas(), input({ combo: 'force', difficulte: 0 }), rules)
    const r = resolveFromFaces(plan, [1, 3, 5, 1, 3, 5, 1], null, rules)
    expect(r.critique).toBe(true)
    expect(r.total).toBe(0)
    expect(r.reussi).toBe(false)
  })

  it('exploit (LdB p. 78) : 4 pairs sur 4 + OD 1 puis relance 2 = 7', () => {
    const c = createCharacter('Fabien', rules)
    c.caracs.savoir = { val: 2, od: 1 }
    c.caracs.technique = { val: 2, od: 0 }
    const plan = planTest(c, input({ base: 'savoir', combo: 'technique', difficulte: 6 }), rules)
    const r = resolveFromFaces(plan, [2, 4, 6, 2], [2, 4, 1, 3], rules)
    expect(r.exploit).toBe(true)
    expect(r.reussitesExploit).toBe(2)
    expect(r.total).toBe(7)
    expect(r.reussi).toBe(true)
  })

  it('un pool de 0 dé est un échec automatique', () => {
    const c = createCharacter('Vide', rules)
    c.jauges.espoir.actuel = 0
    const plan = planTest(c, input({ base: 'combat', combo: 'force', modReussites: 5, difficulte: 1 }), rules)
    expect(plan.des).toBe(0)
    const r = resolveFromCount(plan, 0, 0, rules)
    expect(r.critique).toBe(true)
    expect(r.reussi).toBe(false)
  })

  it('mode « vrais dés » : le nombre de réussites suffit, critique et exploit sont déduits', () => {
    const plan = planTest(nicolas(), input({ combo: 'force', difficulte: 9 }), rules)
    expect(resolveFromCount(plan, 0, 0, rules).critique).toBe(true)
    const exploit = resolveFromCount(plan, 7, 3, rules)
    expect(exploit.exploit).toBe(true)
    expect(exploit.total).toBe(13)
    expect(resolveFromCount(plan, 4, 5, rules).total).toBe(7)
  })

  it('décrit le résultat pour le journal', () => {
    const plan = planTest(nicolas(), input({ combo: 'force', difficulte: 5 }), rules)
    const text = describeResult(resolveFromFaces(plan, [2, 4, 6, 1, 3, 5, 1], null, rules))
    expect(text).toContain('7 dés')
    expect(text).toContain('+3 auto')
    expect(text).toContain('= 6')
  })
})

describe('panneau de test', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup(options: { faces?: number[]; pendingBase?: string | null } = {}) {
    const store = useCharactersStore()
    store.init(memoryStorage())
    store.setCarac('combat', 'val', 3)
    store.setCarac('force', 'val', 2)
    store.setCarac('combat', 'od', 1)
    const wrapper = mount(TestPanel, {
      props: { rng: options.faces ? facesRng(options.faces) : undefined, pendingBase: options.pendingBase as never },
    })
    return { store, wrapper }
  }

  it('affiche dés, réussites auto et probabilité', async () => {
    const { wrapper } = setup()
    await wrapper.get('[data-testid="test-combo"]').setValue('force')
    await wrapper.get('[data-testid="test-difficulte"]').setValue('2')
    const preview = wrapper.get('[data-testid="test-preview"]').text()
    expect(preview).toMatch(/5\s*dés/)
    expect(preview).toMatch(/1\s*auto/)
    expect(wrapper.get('[data-testid="test-chance"]').text()).toMatch(/\d+ %/)
  })

  it('mode virtuel : lance, affiche le résultat et l’ajoute au journal', async () => {
    const { store, wrapper } = setup({ faces: [2, 4, 1, 3, 5] })
    await wrapper.get('[data-testid="test-combo"]').setValue('force')
    await wrapper.get('[data-testid="test-difficulte"]').setValue('2')
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="roll-total"]').text()).toBe('3')
    expect(wrapper.get('[data-testid="roll-verdict"]').text()).toBe('RÉUSSI')
    expect(store.active!.journal).toHaveLength(1)
    expect(store.active!.journal[0]!.outcome).toBe('reussite')
  })

  it('mode « J’ai lancé » : 2 réussites + 1 OD contre 2 = réussi et journalisé', async () => {
    const { store, wrapper } = setup()
    await wrapper.get('[data-testid="test-combo"]').setValue('force')
    await wrapper.get('[data-testid="test-difficulte"]').setValue('2')
    await wrapper.get('[data-testid="dice-mode-reel"]').setValue(true)
    await wrapper.get('[data-testid="manual-reussites"]').setValue('2')
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="roll-total"]').text()).toBe('3')
    expect(wrapper.get('[data-testid="roll-verdict"]').text()).toBe('RÉUSSI')
    expect(store.active!.journal[0]!.title).toBe('Test Combat + Force')
  })

  it('mode réel avec faces saisies', async () => {
    const { wrapper } = setup()
    await wrapper.get('[data-testid="test-combo"]').setValue('force')
    await wrapper.get('[data-testid="dice-mode-reel"]').setValue(true)
    await wrapper.get('[data-testid="manual-faces"]').setValue('1 3 5')
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="test-error"]').text()).toContain('5 faces')
    await wrapper.get('[data-testid="manual-faces"]').setValue('1 3 5 1 3')
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="roll-verdict"]').text()).toBe('ÉCHEC CRITIQUE')
  })

  it('mode réel : un exploit demande les réussites de la relance', async () => {
    const { wrapper } = setup()
    await wrapper.get('[data-testid="test-combo"]').setValue('force')
    await wrapper.get('[data-testid="dice-mode-reel"]').setValue(true)
    await wrapper.get('[data-testid="manual-reussites"]').setValue('5')
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="test-error"]').text()).toContain('relance')
    await wrapper.get('[data-testid="manual-exploit"]').setValue('2')
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="roll-total"]').text()).toBe('8')
    expect(wrapper.get('[data-testid="roll-verdict"]').text()).toContain('EXPLOIT')
  })

  it('3ᵉ caractéristique : refusée sans héroïsme, puis dépense 1 point', async () => {
    const { store, wrapper } = setup({ faces: [2] })
    await wrapper.get('[data-testid="test-combo"]').setValue('force')
    await wrapper.get('[data-testid="test-extra"]').setValue('hargne')
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="test-error"]').text()).toContain('héroïsme')
    store.setGauge('heroisme', 2)
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    expect(store.active!.jauges.heroisme.actuel).toBe(1)
  })

  it('la base suit le clic sur une caractéristique de la fiche', async () => {
    const { wrapper } = setup()
    await wrapper.setProps({ pendingBase: 'tir' })
    await nextTick()
    expect((wrapper.get('[data-testid="test-base"]').element as HTMLSelectElement).value).toBe('tir')
  })

  it('le journal affiche les entrées et se vide après confirmation', async () => {
    const { store, wrapper } = setup({ faces: [2, 2, 2, 2, 2] })
    await wrapper.get('[data-testid="test-roll"]').trigger('click')
    const logWrapper = mount(LogPanel)
    expect(logWrapper.findAll('[data-testid="log-entry"]')).toHaveLength(1)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await logWrapper.get('[data-testid="log-clear"]').trigger('click')
    expect(store.active!.journal).toHaveLength(0)
    confirm.mockRestore()
  })

  it('le journal est limité en taille', () => {
    const { store } = setup()
    expect(useRulesStore().setParam('systeme.journalMax', 10)).toBeNull()
    const c = store.active!
    for (let i = 0; i < 12; i++) {
      c.journal.unshift({ id: String(i), at: '', kind: 'info', title: 't', detail: '', outcome: 'info' })
    }
    useLogStore().add({ kind: 'info', title: 'x', detail: '', outcome: 'info' })
    expect(c.journal).toHaveLength(10)
    expect(c.journal[0]!.title).toBe('x')
  })
})
