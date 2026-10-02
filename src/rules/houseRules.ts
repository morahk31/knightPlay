import { RULES_META, type RuleMeta } from '../config/defaultRules'
import type { RulesConfig } from './types'

/** Règles maison : surcharges validées des paramètres (fiche « Règles », phase 8). */

export type RuleValue = number | boolean | string | number[]
export type RuleOverrides = Record<string, RuleValue>

export function findRuleMeta(path: string): RuleMeta | undefined {
  return RULES_META.find((m) => m.path === path)
}

export function getRuleValue(rules: RulesConfig, path: string): RuleValue | undefined {
  let node: unknown = rules
  for (const key of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return node as RuleValue | undefined
}

function setRuleValue(rules: RulesConfig, path: string, value: RuleValue): void {
  const keys = path.split('.')
  let node = rules as unknown as Record<string, unknown>
  for (const key of keys.slice(0, -1)) node = node[key] as Record<string, unknown>
  node[keys[keys.length - 1]!] = Array.isArray(value) ? [...value] : value
}

/** Message d'erreur si la valeur n'est pas acceptable pour ce paramètre, sinon `null`. */
export function validateRuleValue(meta: RuleMeta, value: unknown): string | null {
  switch (meta.type) {
    case 'bool':
      return typeof value === 'boolean' ? null : 'Valeur oui/non attendue.'
    case 'enum':
      return meta.options.some((o) => o.value === value) ? null : 'Choix inconnu.'
    case 'int':
      if (typeof value !== 'number' || !Number.isInteger(value)) return 'Nombre entier attendu.'
      return value < meta.min || value > meta.max ? `Valeur entre ${meta.min} et ${meta.max} attendue.` : null
    case 'intList':
      if (!Array.isArray(value) || value.length !== meta.length) return `${meta.length} valeurs attendues.`
      if (!value.every((v) => typeof v === 'number' && Number.isInteger(v))) return 'Nombres entiers attendus.'
      return value.some((v: number) => v < meta.min || v > meta.max) ? `Valeurs entre ${meta.min} et ${meta.max} attendues.` : null
  }
}

/** Ne garde que les surcharges connues et valides. */
export function sanitizeOverrides(raw: unknown): { overrides: RuleOverrides; rejetees: string[] } {
  const overrides: RuleOverrides = {}
  const rejetees: string[] = []
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { overrides, rejetees }
  for (const [path, value] of Object.entries(raw as Record<string, unknown>)) {
    const meta = findRuleMeta(path)
    if (meta && validateRuleValue(meta, value) === null) overrides[path] = value as RuleValue
    else rejetees.push(path)
  }
  return { overrides, rejetees }
}

/** Règles effectives : copie des défauts + surcharges valides. */
export function applyOverrides(defaults: RulesConfig, overrides: RuleOverrides): RulesConfig {
  const rules = JSON.parse(JSON.stringify(defaults)) as RulesConfig
  for (const [path, value] of Object.entries(overrides)) {
    const meta = findRuleMeta(path)
    if (meta && validateRuleValue(meta, value) === null) setRuleValue(rules, path, value)
  }
  return rules
}
