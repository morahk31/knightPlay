<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../stores/characters'
import { GAUGE_IDS, GAUGE_LABELS } from '../rules/catalog'
import { gaugeTotals } from '../rules/derived'
import { armorStatus, hasArmor } from '../rules/armor'
import type { GaugeId } from '../rules/types'

const store = useCharactersStore()

const totals = computed(() =>
  store.active ? gaugeTotals(store.active, store.rules) : null,
)

/** Jauges dont le total se saisit à la main (seulement sans méta-armure choisie). */
const manualTotal = (id: GaugeId): id is 'armure' | 'energie' =>
  (id === 'armure' || id === 'energie') && !!store.active && !hasArmor(store.active)

const folded = computed(() => !!store.active && armorStatus(store.active) === 'repliee')

function percent(id: GaugeId): number {
  const total = totals.value?.[id] ?? 0
  const actuel = store.active?.jauges[id].actuel ?? 0
  return total > 0 ? Math.round((actuel / total) * 100) : 0
}

function onInput(id: GaugeId, event: Event): void {
  store.setGauge(id, Number((event.target as HTMLInputElement).value))
}

function onTotal(id: 'armure' | 'energie', event: Event): void {
  store.setGaugeTotal(id, Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <section class="gauges" aria-label="Jauges" data-testid="zone-gauges">
    <div
      v-for="id in GAUGE_IDS"
      :key="id"
      class="gauge"
      :class="`gauge-${id}`"
      :data-testid="`gauge-${id}`"
    >
      <div class="gauge-head">
        <span class="gauge-label">{{ GAUGE_LABELS[id] }}</span>
        <span class="gauge-values">
          <input
            type="number"
            min="0"
            class="gauge-actuel"
            :aria-label="`${GAUGE_LABELS[id]} actuel`"
            :data-testid="`gauge-${id}-actuel`"
            :value="store.active?.jauges[id].actuel ?? 0"
            @change="onInput(id, $event)"
          />
          /
          <input
            v-if="manualTotal(id)"
            type="number"
            min="0"
            class="gauge-total"
            :aria-label="`${GAUGE_LABELS[id]} total`"
            :data-testid="`gauge-${id}-total`"
            :value="totals?.[id] ?? 0"
            @change="onTotal(id, $event)"
          />
          <span v-else class="gauge-total" :data-testid="`gauge-${id}-total`">{{ totals?.[id] ?? 0 }}</span>
        </span>
      </div>
      <div class="gauge-bar" role="progressbar" :aria-valuenow="percent(id)" aria-valuemin="0" aria-valuemax="100">
        <div class="gauge-fill" :style="{ width: `${percent(id)}%` }"></div>
      </div>
      <div v-if="id === 'armure' && folded" class="gauge-guardian" data-testid="gauge-guardian">
        Repliée · Guardian {{ store.active?.armure.guardianPa }}/{{ store.rules.armure.guardianPa }} PA, CdF {{ store.rules.armure.guardianCdf }}
      </div>
      <div class="gauge-buttons">
        <button type="button" :data-testid="`gauge-${id}-minus`" :aria-label="`${GAUGE_LABELS[id]} −1`" @click="store.adjustGauge(id, -1)">−1</button>
        <button type="button" :data-testid="`gauge-${id}-plus`" :aria-label="`${GAUGE_LABELS[id]} +1`" @click="store.adjustGauge(id, 1)">+1</button>
        <button type="button" class="ghost" :title="`Remettre ${GAUGE_LABELS[id]} au maximum`" @click="store.restoreGauge(id)">Max</button>
      </div>
    </div>
  </section>
</template>
