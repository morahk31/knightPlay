<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import type { Transaction } from '../../rules/types'

const store = useCharactersStore()
const historique = computed(() => store.active?.progression.historique ?? [])

function date(t: Transaction): string {
  const d = new Date(t.at)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function signed(n: number, unit: string): string {
  return n ? `${n > 0 ? '+' : '−'}${Math.abs(n)} ${unit}` : ''
}

function deltas(t: Transaction): string {
  const pgTotal = t.pgTotal && t.pgTotal !== t.pg ? `${signed(t.pgTotal, 'PG total')}` : ''
  return [signed(t.px, 'PX'), signed(t.pg, 'PG'), pgTotal].filter(Boolean).join(' ')
}
</script>

<template>
  <section class="panel" aria-labelledby="history-title" data-testid="history">
    <h4 id="history-title">Historique</h4>
    <ul class="history-list">
      <li v-for="(t, i) in historique" :key="t.id" :class="t.kind" data-testid="history-item">
        <span class="muted">{{ date(t) }}</span>
        <span class="history-label">{{ t.libelle }}<span v-if="t.outrepasse" class="chip custom" title="Règle outrepassée">outrepassé</span></span>
        <span class="history-delta">{{ deltas(t) }}</span>
        <button v-if="i === 0" type="button" class="small-inline" data-testid="history-undo" @click="store.undoTransaction()">Annuler</button>
      </li>
      <li v-if="!historique.length" class="muted">Aucune transaction.</li>
    </ul>
  </section>
</template>
