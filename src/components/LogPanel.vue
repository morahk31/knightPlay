<script setup lang="ts">
import { useLogStore } from '../stores/log'

const log = useLogStore()

function time(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function onClear(): void {
  if (log.entries.length && window.confirm('Vider le journal de ce personnage ?')) log.clear()
}
</script>

<template>
  <section class="card log" aria-labelledby="log-title" data-testid="zone-log">
    <h3 id="log-title">
      Journal
      <button type="button" class="ghost small" :disabled="!log.entries.length" data-testid="log-clear" @click="onClear">
        Vider
      </button>
    </h3>
    <p v-if="!log.entries.length" class="placeholder">Aucun jet pour l’instant.</p>
    <ol v-else class="log-list" data-testid="log-list">
      <li v-for="e in log.entries" :key="e.id" :class="e.outcome" data-testid="log-entry">
        <div class="log-head">
          <strong>{{ e.title }}</strong>
          <time :datetime="e.at">{{ time(e.at) }}</time>
        </div>
        <div class="log-detail">{{ e.detail }}</div>
      </li>
    </ol>
  </section>
</template>
