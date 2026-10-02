<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { ASPECTS, CARAC_LABELS } from '../../rules/catalog'
import { aspectCap, sheetWarnings } from '../../rules/derived'
import { effectiveOd, hasArmor } from '../../rules/armor'
import type { CaracId } from '../../rules/types'
import NumberField from '../ui/NumberField.vue'

const emit = defineEmits<{
  /** Clic sur le nom d'une caractéristique : la proposer comme base de test. */
  'pick-carac': [carac: CaracId]
}>()

const store = useCharactersStore()

const warnings = computed(() => (store.active ? sheetWarnings(store.active, store.rules) : []))
const flagged = computed(() => new Set(warnings.value.map((w) => w.target)))
const armored = computed(() => !!store.active && hasArmor(store.active))

/** OD effectifs : achetés + armure + type Warrior ; 0 si l'armure est repliée ou sans énergie. */
function effective(carac: CaracId): number {
  return store.active ? effectiveOd(store.active, carac, store.rules) : 0
}

/** Les OD effectifs diffèrent des OD saisis (armure, type Warrior, armure repliée…). */
function differs(carac: CaracId): boolean {
  return !!store.active && effective(carac) !== store.active.caracs[carac].od
}
</script>

<template>
  <section class="panel" aria-labelledby="aspects-title">
    <div class="panel-head">
      <h3 id="aspects-title">Aspects et caractéristiques</h3>
      <span class="hint">Clic sur un nom : base du test · badge or = overdrives effectifs{{ armored ? ' (armure comprise)' : '' }}</span>
    </div>
    <div v-if="store.active" class="aspect-cards">
      <div v-for="aspect in ASPECTS" :key="aspect.id" class="aspect-card" :class="{ warn: flagged.has(aspect.id) }" :data-testid="`aspect-${aspect.id}`">
        <div class="aspect-card-head">
          <span class="aspect-name">{{ aspect.nom }}</span>
          <NumberField
            :model-value="store.active.aspects[aspect.id]"
            :label="`Aspect ${aspect.nom} (maximum ${aspectCap(store.active, aspect.id, store.rules)})`"
            :data-testid="`aspect-${aspect.id}-input`"
            class="aspect-value"
            @update:model-value="store.setAspect(aspect.id, $event)"
          />
        </div>
        <div class="carac-grid">
          <span></span>
          <span class="carac-col">Score</span>
          <span class="carac-col" :title="armored ? 'OD achetés, en plus de ceux de l’armure' : 'Overdrives'">{{ armored ? 'OD achetés' : 'OD' }}</span>
          <span class="carac-col">Effectifs</span>
          <template v-for="carac in aspect.caracs" :key="carac">
            <button
              type="button"
              class="carac-name link"
              :class="{ warn: flagged.has(carac) }"
              :title="`Utiliser ${CARAC_LABELS[carac]} comme base de test`"
              :data-testid="`carac-${carac}`"
              @click="emit('pick-carac', carac)"
            >
              {{ CARAC_LABELS[carac] }}
            </button>
            <NumberField
              :model-value="store.active.caracs[carac].val"
              :label="CARAC_LABELS[carac]"
              :data-testid="`carac-${carac}-val`"
              :class="{ 'field-warn': flagged.has(carac) }"
              @update:model-value="store.setCarac(carac, 'val', $event)"
            />
            <NumberField
              :model-value="store.active.caracs[carac].od"
              :label="`Overdrives achetés en ${CARAC_LABELS[carac]}`"
              :data-testid="`carac-${carac}-od`"
              class="od-input"
              @update:model-value="store.setCarac(carac, 'od', $event)"
            />
            <span class="od-effective" :class="{ on: effective(carac) > 0, differs: differs(carac) }"
              :data-testid="`carac-${carac}-od-effectif`"
              :title="differs(carac) ? 'Différent des OD achetés : armure, type Warrior ou armure repliée' : ''">
              {{ effective(carac) > 0 ? `OD ${effective(carac)}` : '—' }}
            </span>
          </template>
        </div>
      </div>
      <div class="aspect-card checks-card" :class="{ warn: warnings.length }">
        <strong>Contrôles de la fiche</strong>
        <ul v-if="warnings.length" class="warnings" data-testid="sheet-warnings">
          <li v-for="w in warnings" :key="w.kind + w.target">⚠ {{ w.message }}</li>
        </ul>
        <template v-else>
          <span class="ok-text">✓ Aucune caractéristique au-dessus de son aspect</span>
          <span class="ok-text">✓ Aspects sous leur maximum</span>
        </template>
      </div>
    </div>
  </section>
</template>
