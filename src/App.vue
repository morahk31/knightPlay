<script setup lang="ts">
import { ref } from 'vue'
import TopBar from './components/TopBar.vue'
import GaugesBar from './components/GaugesBar.vue'
import IdentityPanel from './components/sheet/IdentityPanel.vue'
import AspectsPanel from './components/sheet/AspectsPanel.vue'
import DerivedPanel from './components/sheet/DerivedPanel.vue'
import ArmorPanel from './components/sheet/ArmorPanel.vue'
import ModulesPanel from './components/sheet/ModulesPanel.vue'
import WeaponsPanel from './components/sheet/WeaponsPanel.vue'
import ProgressionPanel from './components/sheet/ProgressionPanel.vue'
import SettingsView from './components/SettingsView.vue'
import RecapView from './components/RecapView.vue'
import ActionsPanel from './components/ActionsPanel.vue'
import NotesPanel from './components/sheet/NotesPanel.vue'
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
/** Fiche du personnage ou écran des règles maison. */
const view = ref<'fiche' | 'regles' | 'recap'>('fiche')
const activeTab = ref<(typeof sheetTabs)[number]['id']>('identite')


/** Caractéristique proposée comme base du prochain test (clic sur la fiche). */
const pendingBase = ref<CaracId | null>(null)
/** Compteur de clics : ouvre l'onglet Test même si la même caractéristique est choisie deux fois. */
const pickSignal = ref(0)

function pickCarac(carac: CaracId): void {
  pendingBase.value = carac
  pickSignal.value += 1
}
</script>

<template>
  <div class="app">
    <TopBar @rules="view = view === 'regles' ? 'fiche' : 'regles'" @recap="view = view === 'recap' ? 'fiche' : 'recap'" />

    <p v-if="store.storageWarning" class="banner warning" role="alert" data-testid="storage-warning">
      {{ store.storageWarning }}
    </p>

    <GaugesBar v-if="view !== 'recap'" />

    <main v-if="view === 'recap'" class="recap-page">
      <RecapView @close="view = 'fiche'" />
    </main>
    <main v-else-if="view === 'regles'" class="settings-page">
      <SettingsView @close="view = 'fiche'" />
    </main>
    <main v-else class="layout">
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
          <header v-if="store.active" class="sheet-header" data-testid="sheet-header">
            <div class="sheet-header-id">
              <div class="sheet-header-name">
                {{ store.active.nom }}<span v-if="store.active.identite.surnom" class="sheet-header-alias"> « {{ store.active.identite.surnom }} »</span>
              </div>
              <div class="sheet-header-sub">
                {{ [store.active.identite.archetype, store.active.identite.blason && `Blason ${store.active.identite.blason}`, store.active.armure.modele !== 'aucune' ? store.active.armure.nom : ''].filter(Boolean).join(' · ') || 'Fiche à compléter' }}
              </div>
            </div>
          </header>
          <AspectsPanel @pick-carac="pickCarac" />
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
        <div v-else class="tab-panel" role="tabpanel" data-testid="tab-notes">
          <NotesPanel />
        </div>
      </section>

      <ActionsPanel :pending-base="pendingBase" :pick-signal="pickSignal" />
    </main>
  </div>
</template>
