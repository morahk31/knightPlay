<script setup lang="ts">
import { ref } from 'vue'
import TopBar from './components/TopBar.vue'
import GaugesBar from './components/GaugesBar.vue'
import IdentityPanel from './components/sheet/IdentityPanel.vue'
import AspectsPanel from './components/sheet/AspectsPanel.vue'
import DerivedPanel from './components/sheet/DerivedPanel.vue'
import TestPanel from './components/actions/TestPanel.vue'
import EnergyPanel from './components/actions/EnergyPanel.vue'
import ArmorPanel from './components/sheet/ArmorPanel.vue'
import ModulesPanel from './components/sheet/ModulesPanel.vue'
import WeaponsPanel from './components/sheet/WeaponsPanel.vue'
import AttackPanel from './components/actions/AttackPanel.vue'
import SoakPanel from './components/actions/SoakPanel.vue'
import ProgressionPanel from './components/sheet/ProgressionPanel.vue'
import LogPanel from './components/LogPanel.vue'
import { useCharactersStore } from './stores/characters'
import type { CaracId } from './rules/types'

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


/** Caractéristique proposée comme base du prochain test (clic sur la fiche). */
const pendingBase = ref<CaracId | null>(null)
</script>

<template>
  <div class="app">
    <TopBar />

    <p v-if="store.storageWarning" class="banner warning" role="alert" data-testid="storage-warning">
      {{ store.storageWarning }}
    </p>

    <GaugesBar />

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
        <div v-if="activeTab === 'identite'" class="tab-panel" role="tabpanel" data-testid="tab-identite">
          <AspectsPanel @pick-carac="pendingBase = $event" />
          <DerivedPanel />
          <IdentityPanel />
        </div>
        <div v-else-if="activeTab === 'armure'" class="tab-panel" role="tabpanel" data-testid="tab-armure">
          <ArmorPanel />
        </div>
        <div v-else-if="activeTab === 'armes'" class="tab-panel" role="tabpanel" data-testid="tab-armes">
          <WeaponsPanel />
        </div>
        <div v-else-if="activeTab === 'progression'" class="tab-panel" role="tabpanel" data-testid="tab-progression">
          <ProgressionPanel />
        </div>
        <div v-else-if="activeTab === 'modules'" class="tab-panel" role="tabpanel" data-testid="tab-modules">
          <ModulesPanel />
        </div>
        <div v-else class="tab-panel" role="tabpanel">
          <h2>{{ store.active?.nom }}</h2>
          <p class="placeholder">Contenu de l’onglet à venir.</p>
        </div>
      </section>

      <aside class="actions-panel" aria-label="Actions" data-testid="zone-actions">
        <TestPanel :pending-base="pendingBase" />
        <AttackPanel />
        <SoakPanel />
        <EnergyPanel />
        <LogPanel />
      </aside>
    </main>
  </div>
</template>
