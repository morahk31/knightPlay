<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { ASPECTS, CARAC_LABELS } from '../../rules/catalog'
import { aspectCap, sheetWarnings } from '../../rules/derived'
import type { AspectId, CaracId } from '../../rules/types'

const emit = defineEmits<{
  /** Clic sur le nom d'une caractéristique : la proposer comme base de test (phase 3). */
  'pick-carac': [carac: CaracId]
}>()

const store = useCharactersStore()

const warnings = computed(() => (store.active ? sheetWarnings(store.active, store.rules) : []))
const flagged = computed(() => new Set(warnings.value.map((w) => w.target)))

function num(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}

function cap(aspect: AspectId): number {
  return store.active ? aspectCap(store.active, aspect, store.rules) : store.rules.limites.aspectMax
}
</script>

<template>
  <section class="panel" aria-labelledby="aspects-title">
    <h3 id="aspects-title">Aspects et caractéristiques</h3>
    <div v-if="store.active" class="aspects-grid">
      <div v-for="aspect in ASPECTS" :key="aspect.id" class="aspect-col" :data-testid="`aspect-${aspect.id}`">
        <label class="aspect-head" :class="{ warn: flagged.has(aspect.id) }">
          <span>{{ aspect.nom }}</span>
          <input
            type="number"
            min="0"
            :max="cap(aspect.id)"
            :data-testid="`aspect-${aspect.id}-input`"
            :value="store.active.aspects[aspect.id]"
            @change="store.setAspect(aspect.id, num($event))"
          />
        </label>
        <div class="carac-head" aria-hidden="true"><span></span><span>Score</span><span>OD</span></div>
        <div
          v-for="carac in aspect.caracs"
          :key="carac"
          class="carac-row"
          :class="{ warn: flagged.has(carac) }"
          :data-testid="`carac-${carac}`"
        >
          <button
            type="button"
            class="carac-name link"
            :title="`Utiliser ${CARAC_LABELS[carac]} comme base de test`"
            @click="emit('pick-carac', carac)"
          >
            {{ CARAC_LABELS[carac] }}
          </button>
          <input
            type="number"
            min="0"
            :aria-label="CARAC_LABELS[carac]"
            :data-testid="`carac-${carac}-val`"
            :value="store.active.caracs[carac].val"
            @change="store.setCarac(carac, 'val', num($event))"
          />
          <input
            type="number"
            min="0"
            class="od"
            :aria-label="`Overdrive ${CARAC_LABELS[carac]}`"
            :data-testid="`carac-${carac}-od`"
            :value="store.active.caracs[carac].od"
            @change="store.setCarac(carac, 'od', num($event))"
          />
        </div>
      </div>
    </div>
    <ul v-if="warnings.length" class="warnings" data-testid="sheet-warnings">
      <li v-for="w in warnings" :key="w.kind + w.target">⚠ {{ w.message }}</li>
    </ul>
  </section>
</template>
