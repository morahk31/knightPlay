import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useCharactersStore } from '../src/stores/characters'
import AspectsPanel from '../src/components/sheet/AspectsPanel.vue'
import DerivedPanel from '../src/components/sheet/DerivedPanel.vue'
import IdentityPanel from '../src/components/sheet/IdentityPanel.vue'
import { memoryStorage } from './helpers'

/** Silas : Ranger (OD de Tir 1 apporté par l'armure), Tir 5, Machine 5. */
function silas() {
  const store = useCharactersStore()
  store.init(memoryStorage())
  store.setArmorModel('ranger')
  store.setAspect('machine', 5)
  store.setCarac('tir', 'val', 5)
  return store
}

async function type(el: ReturnType<ReturnType<typeof mount>['get']>, value: string) {
  ;(el.element as HTMLInputElement).value = value
  await el.trigger('change')
}

describe('onglet Identité & Aspects', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('noms de caractéristiques complets, OD achetés à 0 et badge « OD 1 » de l’armure', () => {
    silas()
    const wrapper = mount(AspectsPanel)
    expect(wrapper.get('[data-testid="carac-deplacement"]').text()).toBe('Déplacement')
    expect(wrapper.get('[data-testid="carac-sangFroid"]').text()).toBe('Sang-froid')
    expect((wrapper.get('[data-testid="carac-tir-od"]').element as HTMLInputElement).value).toBe('0')
    expect(wrapper.get('[data-testid="carac-tir-od-effectif"]').text()).toBe('OD 1')
    expect(wrapper.get('[data-testid="carac-savoir-od-effectif"]').text()).toBe('—')
    expect(wrapper.text()).toContain('OD achetés')
  })

  it('saisie directe, sans boutons − / + : Combat passe à 2', async () => {
    const store = silas()
    const wrapper = mount(AspectsPanel)
    expect(wrapper.find('[data-testid="aspect-bete"] .aspect-card-head button').exists()).toBe(false)
    await type(wrapper.get('[data-testid="carac-combat-val"]'), '2')
    expect(store.active!.caracs.combat.val).toBe(2)
  })

  it('plafond d’aspect : carte et contrôles signalés', async () => {
    const store = silas()
    const wrapper = mount(AspectsPanel)
    expect(wrapper.text()).toContain('Aucune caractéristique au-dessus de son aspect')
    store.setCarac('combat', 'val', 4)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="sheet-warnings"]').text()).toContain('Combat (4) dépasse')
    expect(wrapper.get('[data-testid="carac-combat"]').classes()).toContain('warn')
  })

  it('valeurs dérivées en tuiles : Réaction 6 « Auto · Tir », valeur forcée signalée puis rétablie', async () => {
    const store = silas()
    const wrapper = mount(DerivedPanel)
    expect(wrapper.findAll('.stat-tile')).toHaveLength(6)
    expect(wrapper.get('[data-testid="derived-reaction-value"]').text()).toBe('6')
    expect(wrapper.get('[data-testid="derived-reaction"]').text()).toContain('Auto · Tir')
    const override = wrapper.get('[data-testid="derived-defense-override"]')
    await type(override, '3')
    expect(wrapper.get('[data-testid="derived-defense-value"]').text()).toBe('3')
    expect(wrapper.get('[data-testid="derived-defense"]').classes()).toContain('manual')
    expect(wrapper.get('[data-testid="derived-defense"]').text()).toContain('Forcée')
    await type(override, '')
    expect(store.active!.overrides.defense).toBeUndefined()
    expect(wrapper.find('[data-testid="derived-defense"] [data-testid="badge-manual"]').exists()).toBe(false)
  })

  it('bonus permanent aux PS dans la tuile des points de santé', async () => {
    const store = silas()
    const wrapper = mount(DerivedPanel)
    await type(wrapper.get('[data-testid="derived-santeMax"] [data-testid="bonus-sante"]'), '5')
    expect(store.active!.bonus.sante).toBe(5)
    expect(wrapper.get('[data-testid="derived-santeMax"]').text()).toContain('bonus 5')
  })

  it('identité sur deux colonnes, description de 7 lignes, avantages avec leur effet', async () => {
    const store = silas()
    store.mutateActive((c) => {
      c.avantages = ['Esprit d’acier']
    })
    const wrapper = mount(IdentityPanel)
    expect(wrapper.findAll('.identity-col')).toHaveLength(2)
    expect(Number(wrapper.get('[data-testid="identity-description"]').attributes('rows'))).toBeGreaterThanOrEqual(6)
    expect(wrapper.get('[data-testid="list-avantages"]').text()).toContain('−1 à chaque perte d’espoir')
    expect(wrapper.get('[data-testid="list-inconvenients"]').text()).toContain('Aucun.')
  })
})
