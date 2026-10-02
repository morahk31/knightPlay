import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { RULES_META, defaultRules } from '../src/config/defaultRules'
import { applyOverrides, getRuleValue, sanitizeOverrides, validateRuleValue } from '../src/rules/houseRules'
import { parseEffects } from '../src/rules/effects'
import { NO_EFFECTS, soak } from '../src/rules/soak'
import { parseRulesFile, serializeRules } from '../src/services/fileIO'
import { useCharactersStore } from '../src/stores/characters'
import { RULES_STORAGE_KEY, useRulesStore } from '../src/stores/rules'
import type { WeaponDef } from '../src/rules/types'
import SettingsView from '../src/components/SettingsView.vue'
import CatalogEditor from '../src/components/CatalogEditor.vue'
import ProgressionPanel from '../src/components/sheet/ProgressionPanel.vue'
import WeaponsPanel from '../src/components/sheet/WeaponsPanel.vue'
import AttackPanel from '../src/components/actions/AttackPanel.vue'
import { memoryStorage } from './helpers'

const CUSTOM: WeaponDef = {
  id: 'perso-lame-polymorphique',
  nom: 'Lame polymorphique',
  categorie: 'contact',
  dispo: 'standard',
  pg: 0,
  source: 'Règle maison',
  profils: [{ nom: 'Lame', type: 'contact', degats: { des: 3, fixe: 0 }, violence: { des: 2, fixe: 0 }, portee: 'contact', effets: [] }],
}

function setup(storage = memoryStorage()) {
  const characters = useCharactersStore()
  characters.init(storage)
  return { characters, rules: useRulesStore(), storage }
}

describe('métadonnées et surcharges', () => {
  it('chaque paramètre décrit pointe vers une valeur existante, valide et sourcée', () => {
    for (const meta of RULES_META) {
      const value = getRuleValue(defaultRules, meta.path)
      expect(value, meta.path).not.toBeUndefined()
      expect(validateRuleValue(meta, value), meta.path).toBeNull()
      expect(meta.source.length, meta.path).toBeGreaterThan(3)
    }
    expect(new Set(RULES_META.map((m) => m.path)).size).toBe(RULES_META.length)
  })

  it('les points contestés réglables sont présents', () => {
    const contestes = RULES_META.filter((m) => m.conteste).map((m) => m.path)
    expect(contestes).toEqual(expect.arrayContaining([
      'encaissement.excedentApresPa', 'combat.akimboArrondi', 'armure.borealisPlasmaPe', 'combat.casserArme.standard', 'combat.modeHeroique',
    ]))
  })

  it('surcharges : valeurs hors bornes ou inconnues ignorées', () => {
    const { overrides, rejetees } = sanitizeOverrides({ 'progression.coutCarac': 3, 'progression.coutAspect': -1, 'inconnu.x': 1 })
    expect(overrides).toEqual({ 'progression.coutCarac': 3 })
    expect(rejetees).toEqual(['progression.coutAspect', 'inconnu.x'])
    expect(applyOverrides(defaultRules, overrides).progression.coutCarac).toBe(3)
    expect(defaultRules.progression.coutCarac).toBe(2)
  })
})

describe('effet immédiat sur les calculs', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('coût de caractéristique ×3 : Combat 3 → 4 coûte 12 PX dans Progression', async () => {
    const { characters, rules } = setup()
    characters.setAspect('bete', 4)
    characters.setCarac('combat', 'val', 3)
    expect(rules.setParam('progression.coutCarac', 3)).toBeNull()
    const wrapper = mount(ProgressionPanel)
    expect(wrapper.get('[data-testid="up-carac-combat"]').text()).toBe('+1 · 12 PX')
  })

  it('excédent après 0 PA réglé sur « PS (LdB) » : l’encaissement envoie l’excédent sur les PS', () => {
    const { characters, rules } = setup()
    characters.setArmorModel('warrior')
    characters.updateArmor({ cdf: 10 })
    characters.setGauge('armure', 3)
    const hit = { degats: 30, ...NO_EFFECTS }
    expect(soak(characters.active!, hit, characters.rules).guardianPerdus).toBe(5)
    rules.setParam('encaissement.excedentApresPa', 'ps')
    expect(soak(characters.active!, hit, characters.rules)).toMatchObject({ guardianPerdus: 0, psDegats: 17 })
  })

  it('Borealis : le coût du plasma vient du paramètre', () => {
    const { characters, rules } = setup()
    rules.setParam('armure.borealisPlasmaPe', 2)
    characters.setArmorModel('wizard')
    expect(characters.active!.armure.capacites.find((c) => c.id === 'borealis-attaque')!.cout).toBe(2)
  })

  it('les règles maison sont sauvegardées et rechargées', () => {
    const storage = memoryStorage()
    setup(storage).rules.setParam('combat.rackMax', 7)
    expect(storage.data.get(RULES_STORAGE_KEY)).toBeUndefined()
    // La sauvegarde suit le watcher : on force un cycle.
    return Promise.resolve().then(() => {
      expect(JSON.parse(storage.data.get(RULES_STORAGE_KEY)!).overrides).toEqual({ 'combat.rackMax': 7 })
      setActivePinia(createPinia())
      expect(setup(storage).characters.rules.combat.rackMax).toBe(7)
    })
  })
})

describe('catalogues personnalisés', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('arme personnalisée : dans le catalogue, le rack et le panneau Attaque', async () => {
    const { characters, rules } = setup()
    rules.upsertCustom('armes', CUSTOM)
    const weapons = mount(WeaponsPanel)
    expect(weapons.get('[data-testid="weapon-select"]').text()).toContain('Lame polymorphique')
    expect(characters.addWeapon(CUSTOM.id)).toBe(true)
    const attack = mount(AttackPanel)
    expect(attack.get('[data-testid="attack-weapon"]').text()).toContain('Lame polymorphique')
  })

  it('copie corrigée : remplace l’entrée fournie ; masquer la retire des listes', () => {
    const { rules } = setup()
    const fusil = rules.catalogs.armes.find((w) => w.id === 'fusil-assaut')!
    rules.upsertCustom('armes', { ...fusil, pg: 25 })
    expect(rules.catalogs.armes.find((w) => w.id === 'fusil-assaut')!.pg).toBe(25)
    expect(rules.catalogs.armes.filter((w) => w.id === 'fusil-assaut')).toHaveLength(1)
    rules.toggleHidden('fusil-assaut')
    expect(rules.catalogs.armes.some((w) => w.id === 'fusil-assaut')).toBe(false)
  })

  it('effet personnalisé reconnu dans les profils', () => {
    const { rules } = setup()
    rules.upsertCustom('effets', { id: 'perso-entrave', label: 'entrave', x: true, description: 'Ralentit la cible.' })
    expect(parseEffects('entrave 2, meurtrier', rules.catalogs.effets)).toEqual([
      { id: 'perso-entrave', x: 2, label: 'entrave' },
      { id: 'meurtrier', label: 'meurtrier' },
    ])
  })

  it('éditeur : création d’une arme, refus sans nom', async () => {
    const { rules } = setup()
    const wrapper = mount(CatalogEditor)
    await wrapper.get('[data-testid="catalog-new"]').trigger('click')
    await wrapper.get('[data-testid="catalog-form"]').trigger('submit')
    expect(wrapper.get('[data-testid="catalog-error"]').text()).toContain('nom')
    await wrapper.get('[data-testid="catalog-nom"]').setValue('Pistolet polymorphique')
    await wrapper.get('[data-testid="catalog-degats-0"]').setValue('2D6+6')
    await wrapper.get('[data-testid="catalog-form"]').trigger('submit')
    const custom = rules.catalogues.armes[0]!
    expect(custom).toMatchObject({ nom: 'Pistolet polymorphique', dispo: 'standard' })
    expect(custom.profils[0]!.degats).toEqual({ des: 2, fixe: 6 })
  })

  it('éditeur : copier une armure pour corriger ses PA', async () => {
    const { rules } = setup()
    const wrapper = mount(CatalogEditor)
    await wrapper.get('[data-testid="catalog-kind-armures"]').trigger('click')
    await wrapper.get('[data-testid="catalog-builtin"]').setValue('rogue')
    await wrapper.get('[data-testid="catalog-copy"]').trigger('click')
    await wrapper.get('[data-testid="catalog-pa"]').setValue('55')
    await wrapper.get('[data-testid="catalog-form"]').trigger('submit')
    const rogue = rules.catalogs.armures.find((a) => a.id === 'rogue')!
    expect(rogue.pa).toBe(55)
    expect(rogue.capacites.length).toBeGreaterThan(0)
  })
})

describe('écran Règles', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('valeur négative refusée avec un message, puis réinitialisation au référentiel', async () => {
    const { rules } = setup()
    const wrapper = mount(SettingsView)
    await wrapper.get('[data-testid="rules-nav-progression"]').trigger('click')
    const input = wrapper.get('[data-testid="param-progression.coutCarac"] input')
    ;(input.element as HTMLInputElement).value = '-2'
    await input.trigger('change')
    expect(wrapper.get('[data-testid="param-error-progression.coutCarac"]').text()).toContain('entre 1 et 50')
    expect(rules.effective.progression.coutCarac).toBe(2)

    ;(input.element as HTMLInputElement).value = '3'
    await input.trigger('change')
    expect(rules.effective.progression.coutCarac).toBe(3)
    expect(wrapper.find('[data-testid="param-error-progression.coutCarac"]').exists()).toBe(false)

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await wrapper.get('[data-testid="rules-reset"]').trigger('click')
    confirm.mockRestore()
    expect(rules.effective.progression.coutCarac).toBe(2)
  })

  it('points contestés : variantes choisies par boutons radio', async () => {
    const { rules } = setup()
    const wrapper = mount(SettingsView)
    const radios = wrapper.findAll('[data-testid="param-combat.modeHeroique"] input[type="radio"]')
    expect(radios).toHaveLength(2)
    await radios[1]!.setValue(true)
    expect(rules.effective.combat.modeHeroique).toBe('points')
    expect(wrapper.text()).toContain('Profils des véhicules')
  })

  it('exporter puis réimporter redonne la même configuration', () => {
    const { rules } = setup()
    rules.setParam('progression.coutOd', [10, 20, 40, 60, 90])
    rules.setParam('combat.akimboArrondi', 'inf')
    rules.upsertCustom('armes', CUSTOM)
    const exported = rules.exportData()
    const text = serializeRules(exported)

    rules.resetAll()
    rules.removeCustom('armes', CUSTOM.id)
    const parsed = parseRulesFile(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    rules.importData(parsed.data)
    expect(rules.exportData()).toEqual(exported)
    expect(rules.effective.progression.coutOd).toEqual([10, 20, 40, 60, 90])
  })

  it('import : fichier d’un autre format refusé', () => {
    expect(parseRulesFile('{"format":"knightplay-character","version":1}')).toMatchObject({ ok: false })
    expect(parseRulesFile('pas du json')).toMatchObject({ ok: false })
  })
})
