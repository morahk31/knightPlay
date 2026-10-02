<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { moduleCostToLevel } from '../../data/modules'
import { useRulesStore } from '../../stores/rules'
import { SLOT_LABELS, SLOT_ZONES, hasArmor, slotUsage } from '../../rules/armor'
import type { InstalledModule, SlotZone } from '../../rules/types'
import Collapsible from '../ui/Collapsible.vue'
import SlotMap from './SlotMap.vue'

const store = useCharactersStore()
const rulesStore = useRulesStore()
const modules = computed(() => rulesStore.catalogs.modules)
const findModule = (id: string) => modules.value.find((m) => m.id === id)
const c = computed(() => store.active)

const categories = computed(() => [...new Set(modules.value.map((m) => m.categorie))])
const selectedId = ref('')
const selectedLevel = ref(1)
const customName = ref('')
const overflowMessage = ref<string | null>(null)

const selectedDef = computed(() => findModule(selectedId.value))
const usage = computed(() => (c.value ? slotUsage(c.value) : null))

const DISPO_LABEL = { standard: 'standard', avance: 'avancé', rare: 'rare', prestige: 'prestige' } as const

function add(force = false): void {
  if (!selectedDef.value) return
  const result = store.addModule(selectedDef.value.id, selectedLevel.value, force)
  if (!result.ok) {
    overflowMessage.value = `Slots insuffisants : ${result.overflow.map((z) => SLOT_LABELS[z as SlotZone]).join(', ')}.`
    return
  }
  overflowMessage.value = null
  selectedId.value = ''
  selectedLevel.value = 1
}

function addCustom(): void {
  store.addCustomModule(customName.value)
  customName.value = ''
}

function slotsText(m: InstalledModule): string {
  const parts = SLOT_ZONES.filter((z) => (m.slots[z] ?? 0) > 0).map((z) => `${m.slots[z]} ${SLOT_LABELS[z]}`)
  return parts.length ? parts.join(', ') : 'aucun slot'
}

function setSlot(m: InstalledModule, zone: SlotZone, event: Event): void {
  const value = Math.max(0, Math.trunc(Number((event.target as HTMLInputElement).value) || 0))
  const slots = { ...m.slots, [zone]: value }
  if (value === 0) delete slots[zone]
  store.updateModule(m.uid, { slots })
}

function setEnergy(m: InstalledModule, event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  store.updateModule(m.uid, { energie: raw === '' ? null : Math.max(0, Math.trunc(Number(raw))) })
}

function levelsOf(m: InstalledModule): number {
  return m.moduleId ? (findModule(m.moduleId)?.niveaux.length ?? 1) : 5
}
</script>

<template>
  <section v-if="c" class="panel" aria-labelledby="modules-title" data-testid="modules-panel">
    <h3 id="modules-title">Modules</h3>
    <p v-if="!hasArmor(c)" class="hint">Choisissez d’abord une méta-armure pour contrôler les slots.</p>

    <div v-if="usage" data-testid="modules-slot-summary"><SlotMap /></div>

    <form class="add-module" @submit.prevent="add()">
      <select v-model="selectedId" data-testid="module-select" @change="selectedLevel = 1; overflowMessage = null">
        <option value="">— Ajouter un module du catalogue —</option>
        <optgroup v-for="cat in categories" :key="cat" :label="cat">
          <option v-for="m in modules.filter((x) => x.categorie === cat)" :key="m.id" :value="m.id">
            {{ m.nom }} ({{ m.niveaux[0]?.pg }} PG, {{ DISPO_LABEL[m.niveaux[0]!.dispo] }})
          </option>
        </optgroup>
      </select>
      <select v-if="selectedDef && selectedDef.niveaux.length > 1" v-model.number="selectedLevel" class="level-select" data-testid="module-level">
        <option v-for="l in selectedDef.niveaux" :key="l.niveau" :value="l.niveau">
          Niv {{ l.niveau }} ({{ moduleCostToLevel(selectedDef, l.niveau) }} PG cumulés)
        </option>
      </select>
      <button type="submit" :disabled="!selectedDef" data-testid="module-add">Ajouter</button>
    </form>
    <p v-if="selectedDef" class="hint">{{ selectedDef.effet }} — {{ selectedDef.source }}</p>
    <p v-if="overflowMessage" class="error-text" role="alert" data-testid="module-overflow">
      {{ overflowMessage }}
      <button type="button" class="small-inline" data-testid="module-force" @click="add(true)">Ajouter quand même</button>
    </p>

    <form class="add-module" @submit.prevent="addCustom">
      <input v-model="customName" placeholder="Module personnalisé…" data-testid="module-custom-name" />
      <button type="submit" data-testid="module-custom-add">Ajouter</button>
    </form>

    <ul class="module-list" data-testid="module-list">
      <li v-for="m in c.modules" :key="m.uid" data-testid="module-item">
        <Collapsible :title="m.nom" :storage-key="`module.${m.uid}`">
          <template #summary>
            <span class="module-summary" data-testid="module-summary">Niv {{ m.niveau }} · {{ m.energie === null ? 'sans PE' : `${m.energie} PE` }} · {{ slotsText(m) }}</span>
          </template>
          <div class="module-body">
            <div class="module-head">
              <input class="module-name" :value="m.nom" aria-label="Nom du module"
                @change="store.updateModule(m.uid, { nom: ($event.target as HTMLInputElement).value })" />
              <label class="inline">
                Niv
                <select :value="m.niveau" :data-testid="`module-${m.uid}-level`"
                  @change="store.setModuleLevel(m.uid, Number(($event.target as HTMLSelectElement).value))">
                  <option v-for="n in levelsOf(m)" :key="n" :value="n">{{ n }}</option>
                </select>
              </label>
              <label class="inline">
                PE
                <input type="number" min="0" placeholder="—" class="w-3ch" :value="m.energie ?? ''" @change="setEnergy(m, $event)" />
              </label>
              <button type="button" class="ghost" :aria-label="`Retirer ${m.nom}`" data-testid="module-remove" @click="store.removeModule(m.uid)">✕</button>
            </div>
            <div class="hint">{{ m.activation }}<template v-if="m.duree"> · {{ m.duree }}</template></div>
            <textarea class="module-effect" rows="2" :value="m.effet" aria-label="Effet"
              @change="store.updateModule(m.uid, { effet: ($event.target as HTMLTextAreaElement).value })"></textarea>
            <div class="slots-inline" aria-label="Slots occupés">
              <label v-for="zone in SLOT_ZONES" :key="zone">
                {{ SLOT_LABELS[zone] }}
                <input type="number" min="0" class="w-2ch" :value="m.slots[zone] ?? 0" @change="setSlot(m, zone, $event)" />
              </label>
            </div>
          </div>
        </Collapsible>
      </li>
      <li v-if="!c.modules.length" class="muted">Aucun module installé.</li>
    </ul>
  </section>
</template>
