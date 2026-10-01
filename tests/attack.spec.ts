import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defaultRules as rules } from '../src/config/defaultRules'
import { findWeapon, unarmedProfile } from '../src/data/weapons'
import {
  DEFAULT_OPTIONS,
  DEFAULT_TARGET,
  effectiveOpposition,
  hitOf,
  planAttack,
  planDamage,
  resolveDamage,
  sumDice,
  type AttackInput,
  type DamageContext,
} from '../src/rules/attack'
import { combatDefenses, styleAttackDice } from '../src/rules/styles'
import { resolveFromCount } from '../src/rules/test'
import type { Character, WeaponProfile } from '../src/rules/types'
import { createCharacter, useCharactersStore } from '../src/stores/characters'
import { normalizeCharacter } from '../src/stores/persistence'
import WeaponsPanel from '../src/components/sheet/WeaponsPanel.vue'
import AttackPanel from '../src/components/actions/AttackPanel.vue'
import { facesRng, memoryStorage } from './helpers'

/** Force 5 (2 OD), Dextérité 4, Tir 4 (1 OD), Combat 3, sans méta-armure. */
function knight(): Character {
  const c = createCharacter('Lancelot', rules)
  c.caracs.force = { val: 5, od: 2 }
  c.caracs.dexterite = { val: 4, od: 0 }
  c.caracs.tir = { val: 4, od: 1 }
  c.caracs.combat = { val: 3, od: 0 }
  return c
}

function profile(weaponId: string, index = 0): WeaponProfile {
  return findWeapon(weaponId)!.profils[index]!
}

function ctx(partial: Partial<DamageContext> = {}): DamageContext {
  return { reussites: null, excedent: null, target: { ...DEFAULT_TARGET }, options: { ...DEFAULT_OPTIONS }, ameliorations: [], ...partial }
}

function input(p: WeaponProfile, partial: Partial<AttackInput> = {}): AttackInput {
  return {
    base: p.type === 'contact' ? 'combat' : 'tir',
    combo: null,
    extra: null,
    modDes: 0,
    modReussites: 0,
    avecOd: true,
    desSacrifies: 0,
    profile: p,
    ameliorations: [],
    target: { ...DEFAULT_TARGET },
    options: { ...DEFAULT_OPTIONS },
    ...partial,
  }
}

describe('dégâts', () => {
  it('marteau-épieu : 3D6 (10) + Force 5 + 2 OD de Force (6) = 21', () => {
    const c = knight()
    const plan = planDamage(c, profile('marteau-epieu'), ctx(), rules)
    expect(sumDice(plan.degats)).toBe(3)
    expect(resolveDamage(plan, [3, 3, 4], [4], null, rules).degats).toBe(21)
  })

  it('morgenstern lesté : 10 + Force × 2 (10) + OD (6) = 26, les OD ne sont pas doublés', () => {
    const plan = planDamage(knight(), profile('morgenstern'), ctx(), rules)
    expect(resolveDamage(plan, 10, 3, null, rules).degats).toBe(26)
  })

  it('fusil de précision, Tir 4 avec 1 OD : +6 fixe et +5 de précision, sans Force', () => {
    const plan = planDamage(knight(), profile('fusil-precision'), ctx(), rules)
    expect(plan.degats.map((p) => p.label)).toEqual(['Arme', 'Précision (Tir + OD)'])
    expect(resolveDamage(plan, 14, 3, null, rules).degats).toBe(14 + 6 + 5)
  })

  it('assistance à l’attaque : 8 réussites contre une défense de 5 → +3 dégâts', () => {
    const c = knight()
    const p = profile('dague')
    const attack = planAttack(c, input(p, { modDes: 10, target: { ...DEFAULT_TARGET, opposition: 5 } }), rules)
    const hit = hitOf(resolveFromCount(attack.test, 8, 0, rules))
    expect(hit).toEqual({ touche: true, excedent: 3 + attack.test.auto })
    const plan = planDamage(c, p, ctx({ excedent: 3 }), rules)
    expect(plan.degats.find((x) => x.label.startsWith('Assistance'))?.fixe).toBe(3)
  })

  it('orfèvrerie ajoute Dextérité et ses OD', () => {
    const plan = planDamage(knight(), profile('couteau-combat'), ctx(), rules)
    expect(plan.degats.find((x) => x.label.startsWith('Orfèvrerie'))?.fixe).toBe(4)
  })

  it('meurtrier et destructeur ajoutent 2D6 selon ce qui est touché', () => {
    const p = profile('pistolet-infiltration', 2)
    expect(sumDice(planDamage(knight(), p, ctx(), rules).degats)).toBe(4)
    expect(sumDice(planDamage(knight(), p, ctx({ target: { ...DEFAULT_TARGET, touchePa: true } }), rules).degats)).toBe(6)
  })

  it('silencieux et assassin ne comptent qu’en attaque surprise', () => {
    const c = knight()
    c.caracs.discretion = { val: 3, od: 1 }
    const p = profile('cimeterre-cinetique')
    const surprise = { ...DEFAULT_OPTIONS, surprise: true }
    expect(sumDice(planDamage(c, p, ctx({ options: surprise }), rules).degats)).toBe(5)
    const couteau = planDamage(c, profile('couteau-combat'), ctx({ options: surprise }), rules)
    expect(couteau.degats.find((x) => x.label.startsWith('Silencieux'))?.fixe).toBe(4)
  })

  it('oblitération contre un hostile : dégâts au maximum', () => {
    const plan = planDamage(knight(), profile('fusil-sonique'), ctx({ target: { ...DEFAULT_TARGET, hostile: true } }), rules)
    expect(plan.maxDegats).toBe(true)
    expect(resolveDamage(plan, 3, 10, null, rules).degats).toBe(24)
  })

  it('ténébricide contre un humain : moitié des dés', () => {
    const plan = planDamage(knight(), profile('canon-uv'), ctx({ target: { ...DEFAULT_TARGET, humain: true } }), rules)
    expect(plan.degats[0]).toMatchObject({ des: 5, fixe: 10 })
  })

  it('mains nues en méta-armure : 1D6 + Force + OD', () => {
    const plan = planDamage(knight(), unarmedProfile(true), ctx(), rules)
    expect(resolveDamage(plan, 4, 1, null, rules).degats).toBe(4 + 5 + 6)
  })

  it('améliorations : munitions explosives +1D6 dégâts −1D6 violence, pointeur laser +1 réussite', () => {
    const c = knight()
    const p = profile('fusil-assaut')
    const plan = planDamage(c, p, ctx({ ameliorations: ['munitions-explosives'] }), rules)
    expect(plan.degats[0]!.des).toBe(3)
    expect(plan.violence[0]!.des).toBe(2)
    expect(planAttack(c, input(p, { ameliorations: ['pointeur-laser'] }), rules).test.auto).toBe(2)
  })
})

describe('bandes et violence', () => {
  it('fureur contre une bande de Chair 12 : +4D6 de violence, dégâts sans effet sur la cohésion', () => {
    const plan = planDamage(knight(), profile('lance-missile', 1), ctx({ target: { ...DEFAULT_TARGET, bande: true, chair: 12 } }), rules)
    expect(plan.violence.find((p) => p.label === 'Fureur')?.des).toBe(4)
    expect(plan.notes.join(' ')).toMatch(/seule la violence/)
  })

  it('ultraviolence contre une bande de Chair inférieure à 10 : +2D6', () => {
    const plan = planDamage(knight(), profile('fusil-assaut'), ctx({ target: { ...DEFAULT_TARGET, bande: true, chair: 8 } }), rules)
    expect(sumDice(plan.violence)).toBe(5)
  })

  it('akimbo : dés de dégâts doublés, moitié de la violence de la 2ᵉ arme (arrondi paramétrable)', () => {
    const p = profile('pistolet-mitrailleur')
    const plan = planDamage(knight(), p, ctx({ options: { ...DEFAULT_OPTIONS, style: 'akimbo' } }), rules)
    expect(plan.degats[0]!.des).toBe(6)
    expect(resolveDamage(plan, 20, 14, 13, rules).violence).toBe(14 + 7)
    const inf = { ...rules, combat: { ...rules.combat, akimboArrondi: 'inf' as const } }
    expect(resolveDamage(plan, 20, 14, 13, inf).violence).toBe(14 + 6)
  })
})

describe('toucher', () => {
  it('style agressif : +3 dés à l’attaque, −2 en défense et réaction du personnage', () => {
    const c = knight()
    const p = profile('epee-batarde')
    const standard = planAttack(c, input(p), rules).test.des
    const agressif = planAttack(c, input(p, { options: { ...DEFAULT_OPTIONS, style: 'agressif' } }), rules).test.des
    expect(agressif - standard).toBe(3)
    c.caracs.hargne.val = 4
    c.caracs.tir.val = 5
    const avant = combatDefenses(c, rules)
    c.combat.style = 'agressif'
    expect(combatDefenses(c, rules)).toEqual({ defense: avant.defense - 2, reaction: avant.reaction - 2 })
  })

  it('jumelé réduit le malus d’akimbo à −1 dé', () => {
    expect(styleAttackDice('akimbo', profile('pistolet-mitrailleur').effets)).toBe(-1)
    expect(styleAttackDice('akimbo', profile('fusil-assaut').effets)).toBe(-3)
  })

  it('point faible, barrage 2 et lumière 4 : défense 16 → 2 (diviser puis soustraire)', () => {
    const target = { ...DEFAULT_TARGET, opposition: 16, pointFaible: true, barrage: 2, lumiere: 4, anatheme: true }
    expect(effectiveOpposition(target, DEFAULT_OPTIONS, rules)).toBe(2)
    expect(effectiveOpposition({ ...target, anatheme: false }, DEFAULT_OPTIONS, rules)).toBe(6)
  })

  it('égalité avec la défense : raté', () => {
    const c = knight()
    const attack = planAttack(c, input(profile('epee-batarde'), { modDes: 10, target: { ...DEFAULT_TARGET, opposition: 5 } }), rules)
    expect(hitOf(resolveFromCount(attack.test, 5, 0, rules)).touche).toBe(false)
    expect(hitOf(resolveFromCount(attack.test, 6, 0, rules)).touche).toBe(true)
  })

  it('attaque surprise : opposition 0 ; désignation : +1 réussite au tir seulement', () => {
    const c = knight()
    const target = { ...DEFAULT_TARGET, opposition: 8, designee: true }
    expect(planAttack(c, input(profile('fusil-assaut'), { target, options: { ...DEFAULT_OPTIONS, surprise: true } }), rules).opposition).toBe(0)
    expect(planAttack(c, input(profile('fusil-assaut'), { target }), rules).reussitesBonus).toBe(1)
    expect(planAttack(c, input(profile('epee-batarde'), { target }), rules).reussitesBonus).toBe(0)
  })

  it('choc : réussites au-delà de Chair ÷ 2 pour un PNJ', () => {
    const plan = planDamage(knight(), profile('epee-longue'), ctx({ reussites: 5, target: { ...DEFAULT_TARGET, chair: 8 } }), rules)
    expect(plan.notes.join(' ')).toMatch(/Choc 1/)
    const sans = planDamage(knight(), profile('epee-longue'), ctx({ reussites: 4, target: { ...DEFAULT_TARGET, chair: 8 } }), rules)
    expect(sans.notes.join(' ')).not.toMatch(/Choc/)
  })

  it('mode héroïque : réussites en trop en D6 (livret) ou en points (LdB)', () => {
    const options = { ...DEFAULT_OPTIONS, heroique: true }
    const des = planDamage(knight(), profile('epee-batarde'), ctx({ excedent: 4, options }), rules)
    expect(des.degats.find((p) => p.label === 'Mode héroïque')).toMatchObject({ des: 4 })
    const points = { ...rules, combat: { ...rules.combat, modeHeroique: 'points' as const } }
    const pts = planDamage(knight(), profile('epee-batarde'), ctx({ excedent: 4, options }), points)
    expect(pts.degats.find((p) => p.label === 'Mode héroïque')).toMatchObject({ fixe: 4 })
  })
})

describe('interface', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup() {
    const store = useCharactersStore()
    store.init(memoryStorage())
    return store
  }

  it('rack : ajout depuis le catalogue, limite de 5 armes, améliorations et sauvegarde', async () => {
    const store = setup()
    const wrapper = mount(WeaponsPanel)
    await wrapper.get('[data-testid="weapon-select"]').setValue('fusil-assaut')
    await wrapper.get('[data-testid="weapon-add"]').trigger('submit')
    expect(store.active!.armes[0]).toMatchObject({ nom: 'Fusil d’assaut', weaponId: 'fusil-assaut' })
    await wrapper.get('[data-testid="upgrade-pointeur-laser"]').trigger('change')
    expect(store.active!.armes[0]!.ameliorations).toEqual(['pointeur-laser'])

    const degats = wrapper.get('[data-testid="weapon-degats"]')
    await degats.setValue('3D6+6')
    await degats.trigger('change')
    expect(store.active!.armes[0]!.profils[0]!.degats).toEqual({ des: 3, fixe: 6 })
    expect(findWeapon('fusil-assaut')!.profils[0]!.degats.des).toBe(2)

    for (let i = 0; i < 4; i++) store.addWeapon('dague')
    expect(store.addWeapon('dague')).toBe(false)
    expect(store.active!.armes).toHaveLength(5)

    const back = normalizeCharacter(JSON.parse(JSON.stringify(store.active)))!
    expect(back.armes).toHaveLength(5)
    expect(back.armes[0]!.ameliorations).toEqual(['pointeur-laser'])
  })

  it('attaque complète en 2 clics : toucher puis dégâts, détail visible et journalisé', async () => {
    const store = setup()
    store.setCarac('combat', 'val', 4)
    store.addWeapon('epee-batarde')
    // Toucher : 4 dés [2 4 6 1] = 3 réussites > 2 ; dégâts 4D6 [3 3 3 3] ; violence 2D6 [5 5]
    const wrapper = mount(AttackPanel, { props: { rng: facesRng([2, 4, 6, 1, 3, 3, 3, 3, 5, 5]) } })
    await wrapper.get('[data-testid="attack-weapon"]').setValue(store.active!.armes[0]!.uid)
    const opp = wrapper.get('[data-testid="attack-opposition"]')
    await opp.setValue('2')
    await opp.trigger('change')
    expect(wrapper.get('[data-testid="attack-preview"]').text()).toContain('contre 2')

    await wrapper.get('[data-testid="attack-roll"]').trigger('click')
    expect(wrapper.get('[data-testid="roll-verdict"]').text()).toBe('RÉUSSI')
    await wrapper.get('[data-testid="attack-damage"]').trigger('click')

    // 12 + Force 1 + orfèvrerie (Dextérité 1) = 14 ; violence 10
    expect(wrapper.get('[data-testid="attack-total-degats"]').text()).toBe('14')
    expect(wrapper.get('[data-testid="attack-total-violence"]').text()).toBe('10')
    expect(wrapper.get('[data-testid="attack-damage-result"]').text()).toContain('Orfèvrerie')
    const journal = store.active!.journal
    expect(journal[0]!.title).toBe('Dégâts : Épée bâtarde')
    expect(journal[1]!.title).toBe('Attaque : Épée bâtarde')
    expect(journal[1]!.outcome).toBe('reussite')
  })

  it('attaque ratée : pas d’étape de dégâts', async () => {
    const store = setup()
    const wrapper = mount(AttackPanel, { props: { rng: facesRng([1]) } })
    const opp = wrapper.get('[data-testid="attack-opposition"]')
    await opp.setValue('0')
    await opp.trigger('change')
    await wrapper.get('[data-testid="attack-roll"]').trigger('click')
    expect(wrapper.find('[data-testid="attack-damage-step"]').exists()).toBe(false)
    expect(store.active!.journal[0]!.outcome).toBe('critique')
  })

  it('vrais dés : réussites puis sommes saisies', async () => {
    const store = setup()
    store.setCarac('combat', 'val', 3)
    store.addWeapon('morgenstern')
    const wrapper = mount(AttackPanel)
    await wrapper.get('[data-testid="attack-weapon"]').setValue(store.active!.armes[0]!.uid)
    await wrapper.get('[data-testid="dice-mode-reel"]').setValue(true)
    await wrapper.get('[data-testid="attack-manual-reussites"]').setValue('1')
    await wrapper.get('[data-testid="attack-roll"]').trigger('click')
    await wrapper.get('[data-testid="attack-sum-degats"]').setValue('10')
    await wrapper.get('[data-testid="attack-sum-violence"]').setValue('4')
    await wrapper.get('[data-testid="attack-damage"]').trigger('click')
    // 10 + Force × 2 (lesté, Force 1) = 12
    expect(wrapper.get('[data-testid="attack-total-degats"]').text()).toBe('12')
  })

  it('le style choisi est enregistré sur la fiche', async () => {
    const store = setup()
    const wrapper = mount(AttackPanel)
    await wrapper.get('[data-testid="attack-style"]').setValue('agressif')
    expect(store.active!.combat.style).toBe('agressif')
  })
})
