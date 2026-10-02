<script setup lang="ts">
import { ref } from 'vue'
import { readUiState, writeUiState } from './uiState'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Le contenu peut être replié depuis le titre. */
    collapsible?: boolean
    storageKey?: string
    defaultOpen?: boolean
  }>(),
  { subtitle: undefined, collapsible: false, storageKey: undefined, defaultOpen: true },
)

const open = ref(
  !props.collapsible || (props.storageKey ? readUiState(`open.${props.storageKey}`, props.defaultOpen) : props.defaultOpen),
)
const bodyId = `section-${Math.random().toString(36).slice(2, 9)}`

function toggle(): void {
  open.value = !open.value
  if (props.storageKey) writeUiState(`open.${props.storageKey}`, open.value)
}
</script>

<template>
  <section class="section-card" :class="{ collapsed: !open }">
    <header class="section-card-head">
      <div class="section-card-titles">
        <h3 class="section-card-title">
          <button v-if="collapsible" type="button" class="section-card-toggle" :aria-expanded="open" :aria-controls="bodyId"
            data-testid="section-toggle" @click="toggle">
            <span aria-hidden="true">{{ open ? '▾' : '▸' }}</span> {{ title }}
          </button>
          <template v-else>{{ title }}</template>
        </h3>
        <p v-if="subtitle" class="section-card-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="section-card-actions"><slot name="actions" /></div>
    </header>
    <div v-show="open" :id="bodyId" class="section-card-body"><slot /></div>
  </section>
</template>
