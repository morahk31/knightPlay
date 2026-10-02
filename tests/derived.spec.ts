import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { defaultRules } from '../src/config/defaultRules'
import { blankSheet } from '../src/rules/catalog'
import {
  aspectCap,
  clampGauges,
  computeDerived,
  gaugeTotals,
  resolveSource,
  sheetWarnings,
} from '../src/rules/derived'
import type { Character, RulesConfig } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import { normalizeCharacter, type KeyValueStorage } from '../src/stores/persistence'
import GaugesBar from '../src/components/GaugesBar.vue'
import AspectsPanel from '../src/components/sheet/AspectsPanel.vue'
import DerivedPanel from '../src/components/sheet/DerivedPanel.vue'
import IdentityPanel from '../src/components/sheet/IdentityPanel.vue'

const rules = defaultRules

function knight(): Character {
  return createCharacter('Test', rules)
}

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

describe('création (étape 1)', () => {
  it('donne 2 dans chaque aspect et 1 dans chaque caractéristique', () => {
    const sheet = blankSheet(rules)
    expect(Object.values(sheet.aspects)).toEqual([2, 2, 2, 2, 2])
    expect(Object.values(sheet.caracs).every((c) => c.val === 1 && c.od === 0)).toBe(true)
    expect(sheet.jauges.espoir).toEqual({ actuel: 50, total: 50 })
    expect(sheet.jauges.sante).toEqual({ actuel: 16, total: 16 })
  })
})

describe('valeurs dérivées (fiche 02, étape 9)', () => {
  it('PS = 10 + 6 × Endurance 4 = 34 (exemple LdB p. 173)', () => {
    const c = knight()
    c.caracs.endurance.val = 4
    c.derivedSource.santeMax = 'endurance'
    expect(computeDerived(c, rules).santeMax.value).toBe(34)
  })

  it('les OD ne comptent pas dans les PS ni les contacts', () => {
    const c = knight()
    c.caracs.force = { val: 3, od: 2 }
    c.caracs.aura = { val: 3, od: 2 }
    const d = computeDerived(c, rules)
    expect(d.santeMax.value).toBe(28)
    expect(d.contactsMax.value).toBe(3)
  })

  it('défense = Combat 3 + 1 OD = 4', () => {
    const c = knight()
    c.caracs.combat = { val: 3, od: 1 }
    c.derivedSource.defense = 'combat'
    expect(computeDerived(c, rules).defense.value).toBe(4)
  })

  it('réaction et initiative incluent les OD de la caractéristique choisie', () => {
    const c = knight()
    c.caracs.tir = { val: 4, od: 1 }
    c.caracs.dexterite = { val: 2, od: 1 }
    const d = computeDerived(c, rules)
    expect(d.reaction.value).toBe(5)
    expect(d.initiative.value).toBe(3)
  })

  it('« auto » retient la meilleure caractéristique de l’aspect', () => {
    const c = knight()
    c.caracs.instinct = { val: 2, od: 2 }
    c.caracs.combat = { val: 3, od: 0 }
    expect(resolveSource(c, 'defense', rules)).toBe('instinct')
    expect(computeDerived(c, rules).defense.value).toBe(4)
  })

  it('une source choisie l’emporte sur « auto »', () => {
    const c = knight()
    c.caracs.instinct = { val: 4, od: 0 }
    c.derivedSource.defense = 'hargne'
    expect(computeDerived(c, rules).defense.value).toBe(1)
  })

  it('une surcharge est conservée et marquée manuelle', () => {
    const c = knight()
    c.caracs.combat.val = 3
    c.overrides.defense = 7
    const d = computeDerived(c, rules).defense
    expect(d).toMatchObject({ value: 7, computed: 3, manual: true })
  })

  it('les bonus s’ajoutent aux totaux de PS et d’espoir', () => {
    const c = knight()
    c.bonus = { sante: 5, espoir: 5 }
    const d = computeDerived(c, rules)
    expect(d.santeMax.value).toBe(21)
    expect(d.espoirMax.value).toBe(55)
  })

  it('les constantes viennent de la configuration (règles maison)', () => {
    const house: RulesConfig = {
      ...rules,
      derivees: { ...rules.derivees, santeBase: 20, santeParPoint: 5, espoirBase: 40 },
    }
    const c = knight()
    c.caracs.endurance.val = 4
    const d = computeDerived(c, house)
    expect(d.santeMax.value).toBe(40)
    expect(d.espoirMax.value).toBe(40)
  })
})

describe('jauges', () => {
  it('l’actuel est ramené entre 0 et le total effectif', () => {
    const c = knight()
    c.jauges.sante.actuel = 999
    c.jauges.espoir.actuel = -4
    c.jauges.heroisme.actuel = 10
    clampGauges(c, rules)
    expect(c.jauges.sante.actuel).toBe(gaugeTotals(c, rules).sante)
    expect(c.jauges.espoir.actuel).toBe(0)
    expect(c.jauges.heroisme.actuel).toBe(6)
  })
})

describe('avertissements', () => {
  it('signale une caractéristique supérieure à son aspect sans la modifier', () => {
    const c = knight()
    c.aspects.chair = 4
    c.caracs.force.val = 5
    const w = sheetWarnings(c, rules)
    expect(w).toHaveLength(1)
    expect(w[0]).toMatchObject({ kind: 'carac-above-aspect', target: 'force' })
    expect(c.caracs.force.val).toBe(5)
  })

  it('applique le maximum de 9 et les plafonds Vétéran (7) et Brute (Machine 5)', () => {
    const c = knight()
    expect(aspectCap(c, 'machine', rules)).toBe(9)
    c.inconvenients.push('Brute')
    expect(aspectCap(c, 'machine', rules)).toBe(5)
    expect(aspectCap(c, 'chair', rules)).toBe(9)
    c.inconvenients.push('vétéran')
    expect(aspectCap(c, 'chair', rules)).toBe(7)
    c.aspects.chair = 8
    expect(sheetWarnings(c, rules).some((w) => w.kind === 'aspect-above-max' && w.target === 'chair')).toBe(true)
  })
})

describe('compatibilité des données', () => {
  it('complète un personnage de la phase 1 avec les nouveaux champs', () => {
    const c = normalizeCharacter({ id: 'old', nom: 'Ancien', createdAt: 'x', updatedAt: 'x' })!
    expect(c.aspects.chair).toBe(2)
    expect(c.caracs.tir).toEqual({ val: 1, od: 0 })
    expect(c.derivedSource.defense).toBe('auto')
    expect(c.overrides).toEqual({})
  })

  it('garde les valeurs valides et remplace les invalides', () => {
    const c = normalizeCharacter({
      id: 'p',
      nom: 'Partiel',
      aspects: { chair: 5, bete: 'x' },
      caracs: { force: { val: 4 } },
      overrides: { defense: 6, reaction: 'n' },
      avantages: ['Dur à cuir', 3],
    })!
    expect(c.aspects.chair).toBe(5)
    expect(c.aspects.bete).toBe(2)
    expect(c.caracs.force).toEqual({ val: 4, od: 0 })
    expect(c.overrides).toEqual({ defense: 6 })
    expect(c.avantages).toEqual(['Dur à cuir'])
  })
})

describe('interface de la fiche', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup(storage = memoryStorage()) {
    const store = useCharactersStore()
    store.init(storage)
    return { store, storage }
  }

  it('−1 Santé diminue la santé actuelle et la sauvegarde suit', async () => {
    const { store, storage } = setup()
    const wrapper = mount(GaugesBar)
    const before = store.active!.jauges.sante.actuel
    await wrapper.get('[data-testid="gauge-sante-minus"]').trigger('click')
    expect(store.active!.jauges.sante.actuel).toBe(before - 1)
    await nextTick()
    store.flush()
    expect(JSON.parse(storage.data.get('knightplay.v1')!).characters[0].jauges.sante.actuel).toBe(before - 1)
  })

  it('une jauge ne dépasse jamais son total ni ne passe sous 0', async () => {
    const { store } = setup()
    const wrapper = mount(GaugesBar)
    for (let i = 0; i < 3; i++) await wrapper.get('[data-testid="gauge-heroisme-minus"]').trigger('click')
    expect(store.active!.jauges.heroisme.actuel).toBe(0)
    const input = wrapper.get('[data-testid="gauge-espoir-actuel"]')
    await input.setValue('80')
    await input.trigger('change')
    expect(store.active!.jauges.espoir.actuel).toBe(50)
  })

  it('armure et énergie ont un total saisi à la main', async () => {
    const { store } = setup()
    const wrapper = mount(GaugesBar)
    const total = wrapper.get('[data-testid="gauge-energie-total"]')
    await total.setValue('70')
    await total.trigger('change')
    expect(store.active!.jauges.energie.total).toBe(70)
    await wrapper.get('[data-testid="gauge-energie-plus"]').trigger('click')
    expect(store.active!.jauges.energie.actuel).toBe(1)
  })

  it('saisir Force 5 avec Chair 4 affiche un avertissement et garde la valeur', async () => {
    const { store } = setup()
    store.setAspect('chair', 4)
    const wrapper = mount(AspectsPanel)
    const input = wrapper.get('[data-testid="carac-force-val"]')
    await input.setValue('5')
    await input.trigger('change')
    expect(store.active!.caracs.force.val).toBe(5)
    expect(wrapper.get('[data-testid="sheet-warnings"]').text()).toContain('Force (5) dépasse')
    expect(wrapper.get('[data-testid="carac-force"]').classes()).toContain('warn')
  })

  it('cliquer sur une caractéristique la propose comme base de test', async () => {
    setup()
    const wrapper = mount(AspectsPanel)
    await wrapper.get('[data-testid="carac-combat"]').trigger('click')
    expect(wrapper.emitted('pick-carac')?.[0]).toEqual(['combat'])
  })

  it('une surcharge de la défense à 7 est gardée et marquée « manuelle » après recalcul', async () => {
    const { store } = setup()
    const wrapper = mount(DerivedPanel)
    const override = wrapper.get('[data-testid="derived-defense-override"]')
    await override.setValue('7')
    await override.trigger('change')
    store.setCarac('combat', 'val', 4)
    await nextTick()
    expect(wrapper.get('[data-testid="derived-defense-value"]').text()).toBe('7')
    expect(wrapper.get('[data-testid="derived-defense-computed"]').text()).toBe('4')
    expect(wrapper.find('[data-testid="derived-defense"] [data-testid="badge-manual"]').exists()).toBe(true)
    await override.setValue('')
    await override.trigger('change')
    expect(wrapper.get('[data-testid="derived-defense-value"]').text()).toBe('4')
  })

  it('choisir Endurance comme source des PS met à jour le total de santé', async () => {
    const { store } = setup()
    store.setCarac('endurance', 'val', 4)
    const wrapper = mount(DerivedPanel)
    await wrapper.get('[data-testid="derived-santeMax-source"]').setValue('endurance')
    expect(wrapper.get('[data-testid="derived-santeMax-value"]').text()).toBe('34')
    expect(gaugeTotals(store.active!, store.rules).sante).toBe(34)
  })

  it('la liste de création propose les entrées du référentiel et accepte une valeur libre', async () => {
    const { store } = setup()
    const wrapper = mount(IdentityPanel, { attachTo: document.body })
    expect(wrapper.findAll('#dl-blasons option')).toHaveLength(12)
    expect(wrapper.findAll('#dl-archetypes option').length).toBeGreaterThanOrEqual(17)

    const blason = wrapper.get('[data-testid="identity-blason"]')
    await blason.setValue('Lion')
    await blason.trigger('change')
    expect(store.active!.identite.voeu).toMatch(/Ne jamais fuir/)

    const archetype = wrapper.get('[data-testid="identity-archetype"]')
    await archetype.setValue('Pilote de drone')
    await archetype.trigger('change')
    expect(store.active!.identite.archetype).toBe('Pilote de drone')

    await wrapper.get('[data-testid="list-avantages-input"]').setValue('Dur à cuir')
    await wrapper.get('[data-testid="list-avantages"] form').trigger('submit')
    expect(store.active!.avantages).toEqual(['Dur à cuir'])
    expect(wrapper.get('[data-testid="list-avantages"]').text()).toContain('+5 au total de points de santé')
    wrapper.unmount()
  })

  it('renommer depuis la fiche met à jour le personnage', async () => {
    const { store } = setup()
    const wrapper = mount(IdentityPanel)
    const nom = wrapper.get('[data-testid="identity-nom"]')
    await nom.setValue('Silas Shark')
    await nom.trigger('change')
    expect(store.active!.nom).toBe('Silas Shark')
  })
})
