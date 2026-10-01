<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { ASPECTS, CARAC_LABELS, DERIVED_ASPECT } from '../../rules/catalog'
import { computeDerived } from '../../rules/derived'
import type { CaracId, DerivedId, DerivedSource, SourcedDerivedId } from '../../rules/types'

const store = useCharactersStore()

const rows: { id: DerivedId; label: string; hint: string }[] = [
  { id: 'defense', label: 'Défense', hint: 'Caractéristique de Bête + ses OD' },
  { id: 'reaction', label: 'Réaction', hint: 'Caractéristique de Machine + ses OD' },
  { id: 'initiative', label: 'Initiative', hint: 'Caractéristique de Masque + ses OD (+ 3D6 en combat)' },
  { id: 'santeMax', label: 'Points de santé', hint: '10 + 6 × caractéristique de Chair (sans OD) + bonus' },
  { id: 'contactsMax', label: 'Points de contact', hint: 'Caractéristique de Dame (sans OD)' },
  { id: 'espoirMax', label: 'Points d’espoir', hint: '50 + bonus (avantages, inconvénients)' },
]

const derived = computed(() => (store.active ? computeDerived(store.active, store.rules) : null))

function isSourced(id: DerivedId): id is SourcedDerivedId {
  return id !== 'espoirMax'
}

function sourceOptions(id: SourcedDerivedId): readonly CaracId[] {
  return ASPECTS.find((a) => a.id === DERIVED_ASPECT[id])!.caracs
}

function onSource(id: SourcedDerivedId, event: Event): void {
  store.setDerivedSource(id, (event.target as HTMLSelectElement).value as DerivedSource)
}

function onOverride(id: DerivedId, event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  store.setOverride(id, raw === '' ? null : Number(raw))
}

function num(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <section class="panel" aria-labelledby="derived-title">
    <h3 id="derived-title">Valeurs dérivées</h3>
    <table v-if="store.active && derived" class="derived-table">
      <thead>
        <tr>
          <th>Valeur</th>
          <th>Source</th>
          <th>Calculée</th>
          <th>Manuelle</th>
          <th>Retenue</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :data-testid="`derived-${row.id}`" :title="row.hint">
          <th scope="row">{{ row.label }}</th>
          <td>
            <select
              v-if="isSourced(row.id)"
              :data-testid="`derived-${row.id}-source`"
              :value="store.active.derivedSource[row.id]"
              @change="onSource(row.id as SourcedDerivedId, $event)"
            >
              <option value="auto">Auto ({{ CARAC_LABELS[derived[row.id].source!] }})</option>
              <option v-for="c in sourceOptions(row.id as SourcedDerivedId)" :key="c" :value="c">
                {{ CARAC_LABELS[c] }}
              </option>
            </select>
            <span v-else class="muted">—</span>
          </td>
          <td :data-testid="`derived-${row.id}-computed`">{{ derived[row.id].computed }}</td>
          <td>
            <input
              type="number"
              min="0"
              placeholder="—"
              :data-testid="`derived-${row.id}-override`"
              :value="store.active.overrides[row.id] ?? ''"
              @change="onOverride(row.id, $event)"
            />
          </td>
          <td>
            <strong :data-testid="`derived-${row.id}-value`">{{ derived[row.id].value }}</strong>
            <span v-if="derived[row.id].manual" class="badge" data-testid="badge-manual">manuelle</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="store.active" class="bonus-row">
      <label>
        Bonus permanent aux PS
        <input type="number" data-testid="bonus-sante" :value="store.active.bonus.sante" @change="store.setBonus('sante', num($event))" />
      </label>
      <label>
        Bonus permanent à l’espoir
        <input type="number" data-testid="bonus-espoir" :value="store.active.bonus.espoir" @change="store.setBonus('espoir', num($event))" />
      </label>
    </div>
  </section>
</template>
