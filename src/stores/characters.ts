import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  AspectId,
  CaracId,
  Character,
  DerivedId,
  DerivedSource,
  GaugeId,
  RulesConfig,
  SourcedDerivedId,
} from '../rules/types'
import { blankSheet } from '../rules/catalog'
import { clampGauges, gaugeTotals } from '../rules/derived'
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
  }
})
