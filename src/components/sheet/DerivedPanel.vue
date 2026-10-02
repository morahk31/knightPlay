<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { ASPECTS, CARAC_LABELS, DERIVED_ASPECT } from '../../rules/catalog'
import { computeDerived } from '../../rules/derived'
import type { CaracId, DerivedId, DerivedSource, SourcedDerivedId } from '../../rules/types'
import StatTile from '../ui/StatTile.vue'
import NumberField from '../ui/NumberField.vue'

const store = useCharactersStore()

const tiles: { id: DerivedId; label: string; hint: string; accent: string }[] = [
  { id: 'defense', label: 'Défense', hint: 'Caractéristique de Bête + ses OD', accent: 'accent' },
  { id: 'reaction', label: 'Réaction', hint: 'Caractéristique de Machine + ses OD', accent: 'accent' },
  { id: 'initiative', label: 'Initiative', hint: 'Caractéristique de Masque + ses OD (+ 3D6 en combat)', accent: 'accent' },
  { id: 'santeMax', label: 'Points de santé', hint: '10 + 6 × caractéristique de Chair (sans OD) + bonus', accent: 'danger' },
  { id: 'contactsMax', label: 'Contacts', hint: 'Caractéristique de Dame (sans OD)', accent: 'gold' },
  { id: 'espoirMax', label: 'Espoir max', hint: '50 + bonus (avantages, inconvénients)', accent: 'ok' },
]

const derived = computed(() => (store.active ? computeDerived(store.active, store.rules) : null))

function isSourced(id: DerivedId): id is SourcedDerivedId {
  return id !== 'espoirMax'
}

function sourceOptions(id: SourcedDerivedId): readonly CaracId[] {
  return ASPECTS.find((a) => a.id === DERIVED_ASPECT[id])!.caracs
}

/** Ligne d'explication sous la valeur : source retenue, ou mention manuelle. */
function note(id: DerivedId): string {
  const d = derived.value?.[id]
  const c = store.active
  if (!d || !c) return ''
  if (d.manual) return `Forcée · calculée ${d.computed}`
  if (id === 'espoirMax') return c.bonus.espoir ? `Base + bonus ${c.bonus.espoir}` : 'Base'
  const auto = c.derivedSource[id as SourcedDerivedId] === 'auto'
  const source = d.source ? CARAC_LABELS[d.source] : ''
  const bonus = id === 'santeMax' && c.bonus.sante ? ` · bonus ${c.bonus.sante}` : ''
  return `${auto ? 'Auto · ' : ''}${source}${bonus}`
}

function onSource(id: SourcedDerivedId, event: Event): void {
  store.setDerivedSource(id, (event.target as HTMLSelectElement).value as DerivedSource)
}

function onOverride(id: DerivedId, event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  store.setOverride(id, raw === '' ? null : Number(raw))
}
</script>

<template>
  <section class="panel" aria-labelledby="derived-title">
    <div class="panel-head">
      <h3 id="derived-title">Valeurs dérivées</h3>
      <span class="hint">Calculées depuis la fiche ; « Modifier » pour changer la source ou forcer une valeur</span>
    </div>
    <div v-if="store.active && derived" class="derived-tiles">
      <StatTile
        v-for="t in tiles"
        :key="t.id"
        :label="t.label"
        :value="derived[t.id].value"
        :note="note(t.id)"
        :accent="t.accent"
        :value-testid="`derived-${t.id}-value`"
        :title="t.hint"
        :data-testid="`derived-${t.id}`"
        :class="{ manual: derived[t.id].manual }"
      >
        <span v-if="derived[t.id].manual" class="badge" data-testid="badge-manual">manuelle</span>
        <details class="derived-edit">
          <summary>Modifier</summary>
          <label v-if="isSourced(t.id)">
            Source
            <select
              :data-testid="`derived-${t.id}-source`"
              :value="store.active.derivedSource[t.id]"
              @change="onSource(t.id as SourcedDerivedId, $event)"
            >
              <option value="auto">Auto ({{ CARAC_LABELS[derived[t.id].source!] }})</option>
              <option v-for="c in sourceOptions(t.id as SourcedDerivedId)" :key="c" :value="c">{{ CARAC_LABELS[c] }}</option>
            </select>
          </label>
          <span class="derived-computed">Calculée : <strong :data-testid="`derived-${t.id}-computed`">{{ derived[t.id].computed }}</strong></span>
          <label>
            Valeur forcée
            <input
              type="number"
              min="0"
              placeholder="—"
              class="w-3ch"
              :data-testid="`derived-${t.id}-override`"
              :value="store.active.overrides[t.id] ?? ''"
              @change="onOverride(t.id, $event)"
            />
          </label>
          <label v-if="t.id === 'santeMax'">
            Bonus permanent
            <NumberField :model-value="store.active.bonus.sante" :min="-99" label="Bonus permanent aux PS" data-testid="bonus-sante"
              @update:model-value="store.setBonus('sante', $event)" />
          </label>
          <label v-if="t.id === 'espoirMax'">
            Bonus permanent
            <NumberField :model-value="store.active.bonus.espoir" :min="-99" label="Bonus permanent à l’espoir" data-testid="bonus-espoir"
              @update:model-value="store.setBonus('espoir', $event)" />
          </label>
        </details>
      </StatTile>
    </div>
  </section>
</template>
