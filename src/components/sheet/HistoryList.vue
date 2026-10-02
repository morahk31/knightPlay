<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import type { Transaction } from '../../rules/types'

const store = useCharactersStore()
const historique = computed(() => store.active?.progression.historique ?? [])

const KIND_LABEL: Record<Transaction['kind'], string> = {
  mission: 'Mission',
  aspect: 'Aspect',
  carac: 'Caractéristique',
  od: 'Overdrive',
  module: 'Module',
  arme: 'Arme',
  legende: 'Arsenal',
  evolution: 'Évolution',
  achat: 'Achat',
  ajustement: 'Correction',
}

/** Totaux de l'historique : PX et PG gagnés et dépensés. */
const totaux = computed(() => {
  const t = { pxGagnes: 0, pxDepenses: 0, pgGagnes: 0, pgDepenses: 0 }
  for (const x of historique.value) {
    if (x.px > 0) t.pxGagnes += x.px
    else t.pxDepenses -= x.px
    if (x.pg > 0) t.pgGagnes += x.pg
    else t.pgDepenses -= x.pg
  }
  return t
})

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
    <div class="panel-head">
      <h4 id="history-title">Historique</h4>
      <span v-if="historique.length" class="hint" data-testid="history-totals">
        PX +{{ totaux.pxGagnes }} / −{{ totaux.pxDepenses }} · PG +{{ totaux.pgGagnes }} / −{{ totaux.pgDepenses }}
      </span>
    </div>
    <ul class="history-list">
      <li v-for="(t, i) in historique" :key="t.id" :class="t.kind" data-testid="history-item">
        <span class="history-kind" :class="t.kind">{{ KIND_LABEL[t.kind] ?? t.kind }}</span>
        <span class="muted">{{ date(t) }}</span>
        <span class="history-label">{{ t.libelle }}<span v-if="t.outrepasse" class="chip custom" title="Règle outrepassée">outrepassé</span></span>
        <span class="history-delta">{{ deltas(t) }}</span>
        <button v-if="i === 0" type="button" class="small-inline" data-testid="history-undo" @click="store.undoTransaction()">Annuler</button>
      </li>
      <li v-if="!historique.length" class="muted">Aucune transaction.</li>
    </ul>
  </section>
</template>
