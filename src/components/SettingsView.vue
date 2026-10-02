<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRulesStore } from '../stores/rules'
import { CONTESTED_INFO, RULE_THEMES, type RuleMeta, type RuleTheme } from '../config/defaultRules'
import { downloadRules, parseRulesFile } from '../services/fileIO'
import { getRuleValue } from '../rules/houseRules'
import { defaultRules } from '../config/defaultRules'
import CatalogEditor from './CatalogEditor.vue'

const emit = defineEmits<{ close: [] }>()

const rules = useRulesStore()
type Section = 'contestes' | RuleTheme | 'catalogues'
const section = ref<Section>('contestes')
const errors = ref<Record<string, string>>({})
const message = ref<{ kind: 'info' | 'error'; text: string } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const params = computed<readonly RuleMeta[]>(() =>
  section.value === 'contestes' ? rules.meta.filter((m) => m.conteste) : rules.meta.filter((m) => m.theme === section.value && !m.conteste),
)

function set(path: string, value: number | boolean | string | number[]): void {
  const error = rules.setParam(path, value)
  const next = { ...errors.value }
  if (error) next[path] = error
  else delete next[path]
  errors.value = next
}

function setInt(meta: RuleMeta, event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  set(meta.path, raw.trim() === '' ? NaN : Number(raw))
}

function setListItem(meta: RuleMeta, index: number, event: Event): void {
  const list = [...((rules.value(meta.path) as number[]) ?? [])]
  list[index] = Number((event.target as HTMLInputElement).value)
  set(meta.path, list)
}

function defaultText(meta: RuleMeta): string {
  const v = getRuleValue(defaultRules, meta.path)
  if (meta.type === 'bool') return v ? 'oui' : 'non'
  if (meta.type === 'enum') return meta.options.find((o) => o.value === v)?.label ?? String(v)
  return Array.isArray(v) ? v.join(' / ') : String(v)
}

function reset(meta: RuleMeta): void {
  rules.resetParam(meta.path)
  const next = { ...errors.value }
  delete next[meta.path]
  errors.value = next
}

function resetAll(): void {
  if (!window.confirm('Revenir aux valeurs du référentiel pour tous les paramètres ? (Les catalogues personnalisés sont conservés.)')) return
  rules.resetAll()
  errors.value = {}
  message.value = { kind: 'info', text: 'Paramètres remis aux valeurs du référentiel.' }
}

function exporter(): void {
  downloadRules(rules.exportData())
}

async function importer(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const result = parseRulesFile(await file.text())
  if (!result.ok) {
    message.value = { kind: 'error', text: result.error }
    return
  }
  rules.importData(result.data)
  errors.value = {}
  message.value = {
    kind: 'info',
    text: `Règles importées.${result.rejetees.length ? ` Paramètres ignorés (inconnus ou hors bornes) : ${result.rejetees.join(', ')}.` : ''}`,
  }
}

const overriddenCount = computed(() => Object.keys(rules.overrides).length)
</script>

<template>
  <section class="settings" aria-labelledby="settings-title" data-testid="settings">
    <header class="settings-head">
      <h2 id="settings-title">Règles maison <small class="muted">({{ overriddenCount }} paramètre{{ overriddenCount > 1 ? 's' : '' }} modifié{{ overriddenCount > 1 ? 's' : '' }})</small></h2>
      <div class="settings-actions">
        <button type="button" data-testid="rules-export" @click="exporter">Exporter</button>
        <button type="button" data-testid="rules-import" @click="fileInput?.click()">Importer</button>
        <input ref="fileInput" type="file" accept=".json,application/json" hidden data-testid="rules-import-input" @change="importer" />
        <button type="button" data-testid="rules-reset" @click="resetAll">⟲ Référentiel</button>
        <button type="button" class="primary" data-testid="rules-close" @click="emit('close')">Retour à la fiche</button>
      </div>
    </header>
    <p v-if="message" class="notice" :class="message.kind" role="status" data-testid="rules-message">{{ message.text }}</p>

    <div class="settings-body">
      <nav class="settings-nav" aria-label="Thèmes">
        <button type="button" :class="{ active: section === 'contestes' }" data-testid="rules-nav-contestes" @click="section = 'contestes'">⚠ Points contestés</button>
        <button v-for="t in RULE_THEMES" :key="t.id" type="button" :class="{ active: section === t.id }" :data-testid="`rules-nav-${t.id}`" @click="section = t.id">
          {{ t.label }}
        </button>
        <button type="button" :class="{ active: section === 'catalogues' }" data-testid="rules-nav-catalogues" @click="section = 'catalogues'">Catalogues</button>
      </nav>

      <div class="settings-main">
        <CatalogEditor v-if="section === 'catalogues'" />
        <template v-else>
          <p v-if="section === 'contestes'" class="hint">
            Le référentiel signale ces points comme contradictoires ou incertains. Choisissez la variante jouée à votre table.
          </p>
          <div v-for="meta in params" :key="meta.path" class="param" :class="{ modified: rules.isOverridden(meta.path) }" :data-testid="`param-${meta.path}`">
            <div class="param-head">
              <span class="param-label">{{ meta.label }}</span>
              <button v-if="rules.isOverridden(meta.path)" type="button" class="small-inline ghost" :title="`Valeur du référentiel : ${defaultText(meta)}`" @click="reset(meta)">⟲</button>
            </div>
            <div class="param-input">
              <input v-if="meta.type === 'int'" type="number" :min="meta.min" :max="meta.max" :value="rules.value(meta.path)" @change="setInt(meta, $event)" />
              <label v-else-if="meta.type === 'bool'" class="check">
                <input type="checkbox" :checked="rules.value(meta.path) === true" @change="set(meta.path, ($event.target as HTMLInputElement).checked)" />
                {{ rules.value(meta.path) ? 'oui' : 'non' }}
              </label>
              <div v-else-if="meta.type === 'enum'" class="param-options">
                <label v-for="o in meta.options" :key="o.value">
                  <input type="radio" :name="meta.path" :value="o.value" :checked="rules.value(meta.path) === o.value" @change="set(meta.path, o.value)" />
                  {{ o.label }}
                </label>
              </div>
              <div v-else class="param-list">
                <input v-for="(v, i) in (rules.value(meta.path) as number[])" :key="i" type="number" :min="meta.min" :max="meta.max" :value="v"
                  :aria-label="`${meta.label} ${i + 1}`" @change="setListItem(meta, i, $event)" />
              </div>
            </div>
            <p class="param-source">{{ meta.source }}<template v-if="meta.aide"> · {{ meta.aide }}</template> · référentiel : {{ defaultText(meta) }}</p>
            <p v-if="errors[meta.path]" class="error-text" role="alert" :data-testid="`param-error-${meta.path}`">{{ errors[meta.path] }}</p>
          </div>
          <template v-if="section === 'contestes'">
            <div v-for="info in CONTESTED_INFO" :key="info.titre" class="param info">
              <span class="param-label">{{ info.titre }}</span>
              <p class="hint">{{ info.texte }}</p>
              <p class="param-source">{{ info.source }}</p>
            </div>
          </template>
        </template>
      </div>
    </div>
  </section>
</template>
