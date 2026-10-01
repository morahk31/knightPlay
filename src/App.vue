<script setup lang="ts">
import { ref } from 'vue'
import TopBar from './components/TopBar.vue'
import { useCharactersStore } from './stores/characters'

const store = useCharactersStore()

const sheetTabs = [
  { id: 'identite', label: 'Identité & Aspects' },
  { id: 'armure', label: 'Méta-armure' },
  { id: 'armes', label: 'Armes' },
  { id: 'modules', label: 'Modules' },
  { id: 'progression', label: 'Progression' },
  { id: 'notes', label: 'Notes' },
] as const
const activeTab = ref<(typeof sheetTabs)[number]['id']>('identite')

const actionSections = ['Test', 'Attaque', 'Encaisser', 'Modules / Énergie'] as const
</script>

<template>
  <div class="app">
    <TopBar />

    <p v-if="store.storageWarning" class="banner warning" role="alert" data-testid="storage-warning">
      {{ store.storageWarning }}
    </p>

    <section class="gauges" aria-label="Jauges" data-testid="zone-gauges">
      <span class="placeholder">Santé · Armure · Énergie · Espoir · Héroïsme (phase 2)</span>
    </section>

    <main class="layout">
      <section class="sheet" aria-label="Fiche du personnage" data-testid="zone-sheet">
        <nav class="tabs" role="tablist">
          <button
            v-for="tab in sheetTabs"
            :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
        <div class="tab-panel" role="tabpanel">
          <h2>{{ store.active?.nom }}</h2>
          <p class="placeholder">Contenu de l’onglet à venir.</p>
        </div>
      </section>

      <aside class="actions-panel" aria-label="Actions" data-testid="zone-actions">
        <section v-for="section in actionSections" :key="section" class="card">
          <h3>{{ section }}</h3>
          <p class="placeholder">À venir.</p>
        </section>
        <section class="card log" data-testid="zone-log">
          <h3>Journal</h3>
          <p class="placeholder">Aucun jet pour l’instant.</p>
        </section>
      </aside>
    </main>
  </div>
</template>
