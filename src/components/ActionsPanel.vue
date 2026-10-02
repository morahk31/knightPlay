<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLogStore } from '../stores/log'
import type { CaracId } from '../rules/types'
import TestPanel from './actions/TestPanel.vue'
import AttackPanel from './actions/AttackPanel.vue'
import SoakPanel from './actions/SoakPanel.vue'
import EnergyPanel from './actions/EnergyPanel.vue'
import LogPanel from './LogPanel.vue'
import { readUiState, writeUiState } from './ui/uiState'

/** Colonne d'actions : un panneau à la fois, onglet mémorisé. */
const props = defineProps<{
  /** Caractéristique proposée par un clic sur la fiche. */
  pendingBase?: CaracId | null
  /** Incrémenté à chaque clic sur une caractéristique (même valeur deux fois de suite). */
  pickSignal?: number
}>()

const TABS = [
  { id: 'test', label: 'Test' },
  { id: 'attaque', label: 'Attaque' },
  { id: 'encaisser', label: 'Encaisser' },
  { id: 'energie', label: 'Énergie' },
  { id: 'journal', label: 'Journal' },
] as const
type TabId = (typeof TABS)[number]['id']

const log = useLogStore()
const saved = readUiState<string>('actions.tab', 'test')
const active = ref<TabId>(TABS.some((t) => t.id === saved) ? (saved as TabId) : 'test')
const journalCount = computed(() => log.entries.length)

function select(id: TabId): void {
  active.value = id
  writeUiState('actions.tab', id)
}

watch(
  () => props.pickSignal,
  () => {
    if (props.pendingBase) select('test')
  },
)

/** Navigation clavier entre onglets (flèches gauche / droite). */
function onKey(event: KeyboardEvent): void {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  const i = TABS.findIndex((t) => t.id === active.value)
  const next = TABS[(i + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!
  select(next.id)
  ;(event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus()
}
</script>

<template>
  <aside class="actions-panel" aria-label="Actions" data-testid="zone-actions">
    <nav class="action-tabs" role="tablist" aria-label="Actions" @keydown="onKey">
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        role="tab"
        class="action-tab"
        :class="{ active: active === t.id }"
        :aria-selected="active === t.id"
        :tabindex="active === t.id ? 0 : -1"
        :data-tab="t.id"
        :data-testid="`action-tab-${t.id}`"
        @click="select(t.id)"
      >
        {{ t.label }}
        <span v-if="t.id === 'journal' && journalCount" class="tab-badge" data-testid="journal-badge">{{ journalCount }}</span>
      </button>
    </nav>
    <div class="action-panes">
      <div v-show="active === 'test'" class="action-pane" role="tabpanel" data-testid="action-pane-test">
        <TestPanel :pending-base="pendingBase" />
      </div>
      <div v-show="active === 'attaque'" class="action-pane" role="tabpanel" data-testid="action-pane-attaque">
        <AttackPanel />
      </div>
      <div v-show="active === 'encaisser'" class="action-pane" role="tabpanel" data-testid="action-pane-encaisser">
        <SoakPanel />
      </div>
      <div v-show="active === 'energie'" class="action-pane" role="tabpanel" data-testid="action-pane-energie">
        <EnergyPanel />
      </div>
      <div v-show="active === 'journal'" class="action-pane keep-title" role="tabpanel" data-testid="action-pane-journal">
        <LogPanel />
      </div>
    </div>
  </aside>
</template>
