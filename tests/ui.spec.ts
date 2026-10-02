import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberField from '../src/components/ui/NumberField.vue'
import Collapsible from '../src/components/ui/Collapsible.vue'
import SectionCard from '../src/components/ui/SectionCard.vue'
import StatTile from '../src/components/ui/StatTile.vue'

/** v-show : contenu masqué par `display: none`. */
function shown(el: { attributes: (name: string) => string | undefined }): boolean {
  return !(el.attributes('style') ?? '').includes('display: none')
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

async function type(wrapper: ReturnType<typeof mount>, value: string) {
  const input = wrapper.get('input')
  ;(input.element as HTMLInputElement).value = value
  await input.trigger('change')
  return input.element as HTMLInputElement
}

describe('NumberField', () => {
  it('saisie directe : émet la nouvelle valeur, largeur selon le nombre de chiffres, sans boutons', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: 3, label: 'Combat', digits: 3 } })
    await type(wrapper, '7')
    expect(wrapper.emitted('update:modelValue')).toEqual([[7]])
    expect(wrapper.get('input').classes()).toContain('w-3ch')
    expect(wrapper.get('input').attributes('aria-label')).toBe('Combat')
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('saisie vide ou invalide : la valeur est rétablie, rien n’est émis', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: 3, label: 'Combat' } })
    expect((await type(wrapper, '')).value).toBe('3')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('bornes : 12 avec un maximum de 9 est ramené à 9 ; −4 au minimum 0', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: 3, label: 'Aspect', max: 9 } })
    expect((await type(wrapper, '12')).value).toBe('9')
    expect((await type(wrapper, '-4')).value).toBe('0')
    expect(wrapper.emitted('update:modelValue')).toEqual([[9], [0]])
  })
})

describe('Collapsible', () => {
  it('fermé par défaut, s’ouvre au clic sur l’en-tête, avec aria-expanded', async () => {
    const wrapper = mount(Collapsible, { props: { title: 'Améliorations' }, slots: { default: '<p>contenu</p>', summary: '<span>3</span>' } })
    const toggle = wrapper.get('[data-testid="collapsible-toggle"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(shown(wrapper.get('[data-testid="collapsible-body"]'))).toBe(false)
    expect(wrapper.text()).toContain('3')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(shown(wrapper.get('[data-testid="collapsible-body"]'))).toBe(true)
  })

  it('l’état ouvert est retrouvé au remontage grâce à la clé de mémorisation', async () => {
    const first = mount(Collapsible, { props: { title: 'Arbre', storageKey: 'arbre' } })
    await first.get('[data-testid="collapsible-toggle"]').trigger('click')
    const second = mount(Collapsible, { props: { title: 'Arbre', storageKey: 'arbre' } })
    expect(second.get('[data-testid="collapsible-toggle"]').attributes('aria-expanded')).toBe('true')
  })

  it('stockage indisponible : fonctionne sans mémoriser', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqué') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqué') })
    const wrapper = mount(Collapsible, { props: { title: 'Arbre', storageKey: 'arbre', defaultOpen: false } })
    await wrapper.get('[data-testid="collapsible-toggle"]').trigger('click')
    expect(shown(wrapper.get('[data-testid="collapsible-body"]'))).toBe(true)
  })
})

describe('SectionCard', () => {
  it('titre, sous-titre et actions rendus ; contenu visible', () => {
    const wrapper = mount(SectionCard, {
      props: { title: 'Valeurs dérivées', subtitle: 'calculées depuis la fiche' },
      slots: { default: '<p class="body">corps</p>', actions: '<button type="button">Réinitialiser</button>' },
    })
    expect(wrapper.get('.section-card-title').text()).toBe('Valeurs dérivées')
    expect(wrapper.text()).toContain('calculées depuis la fiche')
    expect(wrapper.get('button').text()).toBe('Réinitialiser')
    expect(shown(wrapper.get('.section-card-body'))).toBe(true)
  })

  it('variante repliable : le titre devient un bouton qui masque le contenu', async () => {
    const wrapper = mount(SectionCard, { props: { title: 'Capacités', collapsible: true }, slots: { default: '<p class="body">corps</p>' } })
    await wrapper.get('[data-testid="section-toggle"]').trigger('click')
    expect(shown(wrapper.get('.section-card-body'))).toBe(false)
    expect(wrapper.get('[data-testid="section-toggle"]').attributes('aria-expanded')).toBe('false')
  })
})

describe('StatTile', () => {
  it('libellé, valeur, note et accent du thème', () => {
    const wrapper = mount(StatTile, { props: { label: 'Réaction', value: 6, note: 'Auto · Tir + OD', accent: 'gold' } })
    expect(wrapper.get('[data-testid="stat-tile-value"]').text()).toBe('6')
    expect(wrapper.text()).toContain('Auto · Tir + OD')
    expect(wrapper.get('.stat-tile').attributes('style')).toContain('var(--gold)')
  })
})
