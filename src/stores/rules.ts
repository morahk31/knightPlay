import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { RULES_META, defaultRules } from '../config/defaultRules'
import { emptyCatalogs, mergeCatalogs, sanitizeCatalogs, type CatalogKind, type CustomCatalogs } from '../data/catalog'
import {
  applyOverrides,
  findRuleMeta,
  getRuleValue,
  sanitizeOverrides,
  validateRuleValue,
  type RuleOverrides,
  type RuleValue,
} from '../rules/houseRules'
import type { RulesConfig } from '../rules/types'
import { getBrowserStorage, type KeyValueStorage } from './persistence'

export const RULES_STORAGE_KEY = 'knightplay.rules.v1'

/** Données persistées et exportées des règles maison. */
export interface HouseRulesData {
  overrides: RuleOverrides
  catalogues: CustomCatalogs
}

/**
 * Règles maison : surcharges des paramètres et catalogues personnalisés.
 * Les règles effectives (`effective`) alimentent tous les calculs.
 */
export const useRulesStore = defineStore('rules', () => {
  const overrides = ref<RuleOverrides>({})
  const catalogues = ref<CustomCatalogs>(emptyCatalogs())
  let storage: KeyValueStorage | null = null
  let initialized = false

  const effective = computed<RulesConfig>(() => applyOverrides(defaultRules, overrides.value))
  const catalogs = computed(() => mergeCatalogs(catalogues.value))

  function load(data: unknown): string[] {
    const record = data !== null && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    const { overrides: clean, rejetees } = sanitizeOverrides(record.overrides)
    overrides.value = clean
    catalogues.value = sanitizeCatalogs(record.catalogues)
    return rejetees
  }

  function save(): void {
    if (!storage) return
    try {
      storage.setItem(RULES_STORAGE_KEY, JSON.stringify(exportData()))
    } catch {
      // Stockage plein ou refusé : les règles restent actives pour la session.
    }
  }

  function init(customStorage?: KeyValueStorage | null): void {
    if (initialized) return
    initialized = true
    storage = customStorage === undefined ? getBrowserStorage() : customStorage
    try {
      const raw = storage?.getItem(RULES_STORAGE_KEY)
      if (raw) load(JSON.parse(raw))
    } catch {
      // Données illisibles : on repart des règles du référentiel.
    }
    watch([overrides, catalogues], save, { deep: true })
  }

  /** Valeur effective d'un paramètre. */
  function value(path: string): RuleValue | undefined {
    return getRuleValue(effective.value, path)
  }

  function isOverridden(path: string): boolean {
    return path in overrides.value
  }

  /** Modifie un paramètre ; renvoie un message d'erreur si la valeur est refusée. */
  function setParam(path: string, v: RuleValue): string | null {
    const meta = findRuleMeta(path)
    if (!meta) return 'Paramètre inconnu.'
    const error = validateRuleValue(meta, v)
    if (error) return error
    const next = { ...overrides.value }
    if (JSON.stringify(getRuleValue(defaultRules, path)) === JSON.stringify(v)) delete next[path]
    else next[path] = Array.isArray(v) ? [...v] : v
    overrides.value = next
    return null
  }

  function resetParam(path: string): void {
    const next = { ...overrides.value }
    delete next[path]
    overrides.value = next
  }

  /** Revient aux valeurs du référentiel (les catalogues personnalisés sont conservés). */
  function resetAll(): void {
    overrides.value = {}
  }

  /** Ajoute ou remplace une entrée personnalisée (même identifiant = remplacement). */
  function upsertCustom<K extends CatalogKind>(kind: K, entry: CustomCatalogs[K][number]): void {
    const list = catalogues.value[kind] as { id: string }[]
    const next = [...list.filter((x) => x.id !== entry.id), JSON.parse(JSON.stringify(entry))]
    catalogues.value = { ...catalogues.value, [kind]: next }
  }

  function removeCustom(kind: CatalogKind, id: string): void {
    const list = catalogues.value[kind] as { id: string }[]
    catalogues.value = { ...catalogues.value, [kind]: list.filter((x) => x.id !== id) }
  }

  function toggleHidden(id: string): void {
    const masques = catalogues.value.masques
    catalogues.value = {
      ...catalogues.value,
      masques: masques.includes(id) ? masques.filter((x) => x !== id) : [...masques, id],
    }
  }

  function exportData(): HouseRulesData {
    return JSON.parse(JSON.stringify({ overrides: overrides.value, catalogues: catalogues.value }))
  }

  /** Remplace les règles maison par celles d'un fichier ; renvoie les paramètres refusés. */
  function importData(data: HouseRulesData): string[] {
    return load(data)
  }

  return {
    overrides,
    catalogues,
    effective,
    catalogs,
    meta: RULES_META,
    init,
    value,
    isOverridden,
    setParam,
    resetParam,
    resetAll,
    upsertCustom,
    removeCustom,
    toggleHidden,
    exportData,
    importData,
  }
})
