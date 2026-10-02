<script setup lang="ts">
import { ref } from 'vue'
import { readUiState, writeUiState } from './uiState'

const props = withDefaults(
  defineProps<{
    title: string
    /** Clé de mémorisation de l'état ouvert (aucune = non mémorisé). */
    storageKey?: string
    defaultOpen?: boolean
  }>(),
  { storageKey: undefined, defaultOpen: false },
)

const open = ref(props.storageKey ? readUiState(`open.${props.storageKey}`, props.defaultOpen) : props.defaultOpen)
const id = `collapsible-${Math.random().toString(36).slice(2, 9)}`

function toggle(): void {
  open.value = !open.value
  if (props.storageKey) writeUiState(`open.${props.storageKey}`, open.value)
}
</script>

<template>
  <div class="collapsible" :class="{ open }">
    <div class="collapsible-head">
      <button type="button" class="collapsible-toggle" :aria-expanded="open" :aria-controls="id" data-testid="collapsible-toggle" @click="toggle">
        <span class="collapsible-caret" aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
        <span class="collapsible-title">{{ title }}</span>
      </button>
      <div v-if="$slots.summary" class="collapsible-summary"><slot name="summary" /></div>
    </div>
    <div v-show="open" :id="id" class="collapsible-body" data-testid="collapsible-body"><slot /></div>
  </div>
</template>
