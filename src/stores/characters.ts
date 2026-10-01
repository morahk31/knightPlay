import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  ArmorState,
  AspectId,
  CaracId,
  Character,
  InstalledModule,
  OwnedWeapon,
  StyleId,
  WeaponProfile,
  DerivedId,
  DerivedSource,
  GaugeId,
  RulesConfig,
  SourcedDerivedId,
} from '../rules/types'
import { blankSheet } from '../rules/catalog'
import { clampGauges, gaugeTotals } from '../rules/derived'
import { CUSTOM_ARMOR, NO_ARMOR, armorFromDef, moduleFromDef, noArmor, slotOverflow } from '../rules/armor'
import {
  foldRestEnergy,
  resetNods,
  restEnergy,
  spendEnergy,
  useNod as applyNod,
  type EnergyResult,
  type NodKind,
} from '../rules/energy'
import { findArmor } from '../data/armors'
import { findModule } from '../data/modules'
import { findWeapon } from '../data/weapons'
import { defaultRules } from '../config/defaultRules'
import {
  getBrowserStorage,
  loadState,
  newId,
  saveState,
  type KeyValueStorage,
  type PersistedState,
} from './persistence'

/** Délai de regroupement des sauvegardes automatiques (ms). */
export const SAVE_DEBOUNCE_MS = 300

export const DEFAULT_CHARACTER_NAME = 'Nouveau chevalier'

export function createCharacter(nom = DEFAULT_CHARACTER_NAME, rules: RulesConfig = defaultRules): Character {
  const now = new Date().toISOString()
  return { id: newId(), nom, createdAt: now, updatedAt: now, ...blankSheet(rules) }
}

/** Entier positif ou nul (les saisies vides ou invalides valent 0). */
function toNonNegativeInt(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

export const useCharactersStore = defineStore('characters', () => {
  /** Règles effectives (remplacées par le store des règles maison en phase 8). */
  const rules = ref<RulesConfig>(defaultRules)
  const characters = ref<Character[]>([])
  const activeId = ref<string | null>(null)
  const storageWarning = ref<string | null>(null)

  let storage: KeyValueStorage | null = null
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let initialized = false

  const active = computed(() => characters.value.find((c) => c.id === activeId.value) ?? null)

  function snapshot(): PersistedState {
    return {
      version: 1,
      characters: JSON.parse(JSON.stringify(characters.value)) as Character[],
      activeId: activeId.value,
    }
  }

  /** Écrit immédiatement l'état (utilisé à la fermeture de la page et dans les tests). */
  function flush(): void {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (!storage) return
    if (!saveState(snapshot(), storage)) {
      storageWarning.value =
        'La sauvegarde automatique a échoué (stockage plein ou refusé). Exportez vos personnages.'
    }
  }

  function scheduleSave(): void {
    if (!storage) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(flush, SAVE_DEBOUNCE_MS)
  }

  /**
   * Charge les personnages et active la sauvegarde automatique.
   * Crée un premier personnage si aucun n'existe.
   */
  function init(customStorage?: KeyValueStorage | null): void {
    if (initialized) return
    initialized = true
    storage = customStorage === undefined ? getBrowserStorage() : customStorage
    const result = loadState(storage)
    characters.value = result.state.characters
    activeId.value = result.state.activeId
    storageWarning.value = result.warning ?? null
    if (!result.storageAvailable) storage = null
    if (characters.value.length === 0) create()
    watch([characters, activeId], scheduleSave, { deep: true })
  }

  function touch(character: Character): void {
    character.updatedAt = new Date().toISOString()
  }

  function create(nom?: string): Character {
    const character = createCharacter(nom, rules.value)
    characters.value.push(character)
    activeId.value = character.id
    return character
  }

  function select(id: string): void {
    if (characters.value.some((c) => c.id === id)) activeId.value = id
  }

  function rename(id: string, nom: string): void {
    const character = characters.value.find((c) => c.id === id)
    const trimmed = nom.trim()
    if (!character || trimmed === '') return
    character.nom = trimmed
    touch(character)
  }

  function duplicate(id: string): Character | null {
    const source = characters.value.find((c) => c.id === id)
    if (!source) return null
    const now = new Date().toISOString()
    const copy: Character = {
      ...(JSON.parse(JSON.stringify(source)) as Character),
      id: newId(),
      nom: `${source.nom} (copie)`,
      createdAt: now,
      updatedAt: now,
    }
    characters.value.push(copy)
    activeId.value = copy.id
    return copy
  }

  function remove(id: string): void {
    const index = characters.value.findIndex((c) => c.id === id)
    if (index === -1) return
    characters.value.splice(index, 1)
    if (activeId.value === id) {
      activeId.value = characters.value[Math.min(index, characters.value.length - 1)]?.id ?? null
    }
    if (characters.value.length === 0) create()
  }

  /** Applique une modification au personnage actif, puis met à jour sa date. */
  function mutateActive(mutator: (c: Character) => void): void {
    const character = active.value
    if (!character) return
    mutator(character)
    touch(character)
  }

  function setAspect(aspect: AspectId, value: number): void {
    mutateActive((c) => {
      c.aspects[aspect] = toNonNegativeInt(value)
    })
  }

  function setCarac(carac: CaracId, field: 'val' | 'od', value: number): void {
    mutateActive((c) => {
      c.caracs[carac][field] = toNonNegativeInt(value)
      clampGauges(c, rules.value)
    })
  }

  function setGauge(gauge: GaugeId, actuel: number): void {
    mutateActive((c) => {
      c.jauges[gauge].actuel = toNonNegativeInt(actuel)
      clampGauges(c, rules.value)
    })
  }

  function adjustGauge(gauge: GaugeId, delta: number): void {
    const character = active.value
    if (character) setGauge(gauge, character.jauges[gauge].actuel + delta)
  }

  /** Total manuel (armure et énergie, avant la phase 4). */
  function setGaugeTotal(gauge: 'armure' | 'energie', total: number): void {
    mutateActive((c) => {
      c.jauges[gauge].total = toNonNegativeInt(total)
      clampGauges(c, rules.value)
    })
  }

  function setDerivedSource(id: SourcedDerivedId, source: DerivedSource): void {
    mutateActive((c) => {
      c.derivedSource[id] = source
      clampGauges(c, rules.value)
    })
  }

  function setOverride(id: DerivedId, value: number | null): void {
    mutateActive((c) => {
      if (value === null || !Number.isFinite(value)) delete c.overrides[id]
      else c.overrides[id] = toNonNegativeInt(value)
      clampGauges(c, rules.value)
    })
  }

  function setBonus(kind: 'sante' | 'espoir', value: number): void {
    mutateActive((c) => {
      c.bonus[kind] = Number.isFinite(value) ? Math.trunc(value) : 0
      clampGauges(c, rules.value)
    })
  }

  /** Remet les jauges santé et espoir à leur maximum (repos à Camelot). */
  function restoreGauge(gauge: GaugeId): void {
    const character = active.value
    if (character) setGauge(gauge, gaugeTotals(character, rules.value)[gauge])
  }

  // --- Méta-armure, modules, énergie (phase 4) ---

  /** Choisit une armure du catalogue (ou aucune / personnalisée) et remplit les jauges. */
  function setArmorModel(modele: string): void {
    mutateActive((c) => {
      if (modele === NO_ARMOR) {
        c.armure = noArmor(rules.value)
      } else if (modele === CUSTOM_ARMOR) {
        c.armure = { ...c.armure, modele: CUSTOM_ARMOR, nom: c.armure.nom || 'Armure personnalisée', aVerifier: false }
      } else {
        const def = findArmor(modele)
        if (!def) return
        c.armure = armorFromDef(def, rules.value)
      }
      const totals = gaugeTotals(c, rules.value)
      c.jauges.armure.actuel = totals.armure
      c.jauges.energie.actuel = totals.energie
    })
  }

  /** Modifie une valeur de l'armure (PA, PE, CdF, slots, OD…). */
  function updateArmor(patch: Partial<ArmorState>): void {
    mutateActive((c) => {
      Object.assign(c.armure, patch)
      clampGauges(c, rules.value)
    })
  }

  function setArmorOd(carac: CaracId, value: number): void {
    mutateActive((c) => {
      const v = toNonNegativeInt(value)
      if (v === 0) delete c.armure.od[carac]
      else c.armure.od[carac] = v
    })
  }

  function setPgTotal(value: number): void {
    mutateActive((c) => {
      c.progression.pgTotal = toNonNegativeInt(value)
    })
  }

  /**
   * Installe un module du catalogue. Refuse si les slots manquent, sauf règle maison
   * ou ajout forcé. Renvoie les zones en dépassement.
   */
  function addModule(moduleId: string, niveau = 1, force = false): { ok: boolean; overflow: string[] } {
    const def = findModule(moduleId)
    const character = active.value
    if (!def || !character) return { ok: false, overflow: [] }
    const installed = moduleFromDef(def, niveau, newId())
    const overflow = slotOverflow(character, installed.slots)
    if (overflow.length && !force && !rules.value.armure.depassementSlots) return { ok: false, overflow }
    mutateActive((c) => {
      c.modules.push(installed)
      clampGauges(c, rules.value)
    })
    return { ok: true, overflow }
  }

  function addCustomModule(nom: string): void {
    mutateActive((c) => {
      c.modules.push({
        uid: newId(),
        moduleId: null,
        nom: nom.trim() || 'Module personnalisé',
        niveau: 1,
        slots: {},
        energie: null,
        activation: '',
        duree: '',
        effet: '',
      })
    })
  }

  function updateModule(uid: string, patch: Partial<InstalledModule>): void {
    mutateActive((c) => {
      const m = c.modules.find((x) => x.uid === uid)
      if (!m) return
      Object.assign(m, patch)
      clampGauges(c, rules.value)
    })
  }

  /** Change le niveau d'un module du catalogue en reprenant son effet. */
  function setModuleLevel(uid: string, niveau: number): void {
    mutateActive((c) => {
      const index = c.modules.findIndex((x) => x.uid === uid)
      const current = c.modules[index]
      const def = current?.moduleId ? findModule(current.moduleId) : undefined
      if (!current) return
      if (!def) {
        current.niveau = Math.max(1, toNonNegativeInt(niveau))
        return
      }
      c.modules[index] = { ...moduleFromDef(def, niveau, current.uid), slots: current.slots }
      clampGauges(c, rules.value)
    })
  }

  function removeModule(uid: string): void {
    mutateActive((c) => {
      c.modules = c.modules.filter((m) => m.uid !== uid)
      clampGauges(c, rules.value)
    })
  }

  /** Dépense de l'énergie (activation d'une capacité ou d'un module). */
  function spend(cost: number): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = spendEnergy(c, cost)
    })
    return result
  }

  function nod(kind: NodKind, value: number): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = applyNod(c, kind, value, { sante: gaugeTotals(c, rules.value).sante })
    })
    return result
  }

  function rest(hours: number): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = restEnergy(c, hours, rules.value)
    })
    return result
  }

  function foldRest(): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = foldRestEnergy(c)
    })
    return result
  }

  function newMission(): void {
    mutateActive((c) => resetNods(c, rules.value))
  }

  // --- Armes et combat (phase 5) ---

  /** Ajoute une arme du catalogue au rack ; refuse si le rack est plein. */
  function addWeapon(weaponId: string): boolean {
    const def = findWeapon(weaponId)
    const c = active.value
    if (!def || !c || c.armes.length >= rules.value.combat.rackMax) return false
    mutateActive((x) => {
      x.armes.push({
        uid: newId(),
        weaponId: def.id,
        nom: def.nom,
        profils: JSON.parse(JSON.stringify(def.profils)) as WeaponProfile[],
        ameliorations: [],
        notes: def.notes ?? '',
      })
    })
    return true
  }

  function addCustomWeapon(nom: string, type: 'contact' | 'distance'): boolean {
    const c = active.value
    if (!c || c.armes.length >= rules.value.combat.rackMax) return false
    mutateActive((x) => {
      x.armes.push({
        uid: newId(),
        weaponId: null,
        nom: nom.trim() || 'Arme personnalisée',
        profils: [
          {
            nom: type === 'contact' ? 'Contact' : 'Tir',
            type,
            degats: { des: 2, fixe: 0 },
            violence: { des: 1, fixe: 0 },
            portee: type === 'contact' ? 'contact' : 'moyenne',
            effets: [],
          },
        ],
        ameliorations: [],
        notes: '',
      })
    })
    return true
  }

  function updateWeapon(uid: string, patch: Partial<Omit<OwnedWeapon, 'uid'>>): void {
    mutateActive((c) => {
      const w = c.armes.find((x) => x.uid === uid)
      if (w) Object.assign(w, patch)
    })
  }

  function updateWeaponProfile(uid: string, index: number, patch: Partial<WeaponProfile>): void {
    mutateActive((c) => {
      const profile = c.armes.find((x) => x.uid === uid)?.profils[index]
      if (profile) Object.assign(profile, patch)
    })
  }

  function toggleWeaponUpgrade(uid: string, upgradeId: string): void {
    mutateActive((c) => {
      const w = c.armes.find((x) => x.uid === uid)
      if (!w) return
      w.ameliorations = w.ameliorations.includes(upgradeId)
        ? w.ameliorations.filter((id) => id !== upgradeId)
        : [...w.ameliorations, upgradeId]
    })
  }

  function removeWeapon(uid: string): void {
    mutateActive((c) => {
      c.armes = c.armes.filter((w) => w.uid !== uid)
    })
  }

  function setStyle(style: StyleId): void {
    mutateActive((c) => {
      c.combat.style = style
    })
  }

  function setArmorEtat(etat: 'deployee' | 'repliee'): void {
    mutateActive((c) => {
      c.armure.etat = etat
    })
  }

  /** Active (ou désactive avec `null`) un type de la Warrior. */
  function setWarriorType(type: AspectId | null): void {
    mutateActive((c) => {
      c.armure.warriorType = type
    })
  }

  /** Ajoute un personnage importé (déjà validé et normalisé) et le sélectionne. */
  function addImported(character: Character): void {
    characters.value.push(character)
    activeId.value = character.id
  }

  return {
    rules,
    characters,
    activeId,
    active,
    storageWarning,
    init,
    flush,
    create,
    select,
    rename,
    duplicate,
    remove,
    addImported,
    mutateActive,
    setAspect,
    setCarac,
    setGauge,
    adjustGauge,
    setGaugeTotal,
    setDerivedSource,
    setOverride,
    setBonus,
    restoreGauge,
    setArmorModel,
    updateArmor,
    setArmorOd,
    setPgTotal,
    addModule,
    addCustomModule,
    updateModule,
    setModuleLevel,
    removeModule,
    spend,
    nod,
    rest,
    foldRest,
    newMission,
    setArmorEtat,
    setWarriorType,
    addWeapon,
    addCustomWeapon,
    updateWeapon,
    updateWeaponProfile,
    toggleWeaponUpgrade,
    removeWeapon,
    setStyle,
  }
})
