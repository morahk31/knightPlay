<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { WEAPON_UPGRADES, formatDice, parseDice } from '../../data/weapons'
import { useRulesStore } from '../../stores/rules'
import { effectDescription, effectLabel, formatEffects, parseEffects } from '../../rules/effects'
import LegendTree from './LegendTree.vue'
import Collapsible from '../ui/Collapsible.vue'
import { findChassis } from '../../data/legend'
import { boughtCount, legendInvestment } from '../../rules/legend'
import type { Disponibilite, OwnedWeapon, Portee, WeaponProfile } from '../../rules/types'

const store = useCharactersStore()
const rulesStore = useRulesStore()
const findWeapon = (id: string) => rulesStore.catalogs.armes.find((w) => w.id === id)
const customEffects = computed(() => rulesStore.catalogs.effets)
const c = computed(() => store.active)

const DISPOS: { id: Disponibilite; label: string }[] = [
  { id: 'standard', label: 'Standards' },
  { id: 'avance', label: 'Avancées (100 PG gagnés)' },
  { id: 'rare', label: 'Rares (300 PG gagnés)' },
]
const PORTEES: Portee[] = ['contact', 'courte', 'moyenne', 'longue', 'lointaine']

const selectedId = ref('')
const customName = ref('')
const customType = ref<'contact' | 'distance'>('contact')
const message = ref<string | null>(null)

const selectedDef = computed(() => findWeapon(selectedId.value))
const full = computed(() => (c.value?.armes.length ?? 0) >= store.rules.combat.rackMax)

function add(): void {
  if (!selectedDef.value) return
  message.value = store.addWeapon(selectedDef.value.id) ? null : `Rack plein (${store.rules.combat.rackMax} armes).`
  if (!message.value) selectedId.value = ''
}

function addCustom(): void {
  message.value = store.addCustomWeapon(customName.value, customType.value) ? null : `Rack plein (${store.rules.combat.rackMax} armes).`
  if (!message.value) customName.value = ''
}

function value(event: Event): string {
  return (event.target as HTMLInputElement).value
}

function patch(w: OwnedWeapon, i: number, p: Partial<WeaponProfile>): void {
  store.updateWeaponProfile(w.uid, i, p)
}

function upgradesFor(w: OwnedWeapon) {
  const types = new Set(w.profils.map((p) => p.type))
  return WEAPON_UPGRADES.filter((u) => types.has(u.pour))
}

/** Résumé d'un profil : « 3D6 / 1D6 » (+ Force au contact). */
function profileLine(pr: WeaponProfile): string {
  const force = pr.force ?? pr.type === 'contact'
  return `${formatDice(pr.degats)}${force ? ' + Force' : ''} / ${formatDice(pr.violence)}`
}

/** Effets du dernier profil (forme optimisée pour une arme de légende). */
function lastEffects(w: OwnedWeapon) {
  return w.profils[w.profils.length - 1]?.effets ?? []
}

/** Résumé de l'arsenal de légende d'une arme. */
function legendLine(w: OwnedWeapon): string {
  const state = w.legende
  if (!state) return ''
  const chassis = findChassis(state.chassisId)
  if (!chassis) return 'Arsenal de légende · sans châssis'
  const n = chassis.optimisations.reduce((sum, o) => sum + (boughtCount(state, o.id) > 0 ? 1 : 0), 0)
  return `${chassis.nom} · ${legendInvestment(state)} PG investis · ${n} optimisation${n > 1 ? 's' : ''}`
}

function dispoOf(w: OwnedWeapon): string {
  const def = w.weaponId ? findWeapon(w.weaponId) : undefined
  const casser = def ? store.rules.combat.casserArme[def.dispo === 'prestige' ? 'rare' : def.dispo] : null
  return def
    ? `${def.pg} PG · ${DISPOS.find((d) => d.id === def.dispo)?.label.split(' ')[0]?.toLowerCase()} · ${def.source} · casser : difficulté ${casser}`
    : 'personnalisée'
}
</script>

<template>
  <section v-if="c" class="panel" aria-labelledby="weapons-title" data-testid="weapons-panel">
    <div class="weapons-toolbar">
      <h3 id="weapons-title">Armes <small class="muted">{{ c.armes.length }} / {{ store.rules.combat.rackMax }}</small></h3>
      <form class="add-module grow" @submit.prevent="add">
        <select v-model="selectedId" data-testid="weapon-select" :disabled="full" aria-label="Arme du catalogue">
          <option value="">— Ajouter une arme du catalogue —</option>
          <optgroup v-for="d in DISPOS" :key="d.id" :label="d.label">
            <option v-for="wd in rulesStore.catalogs.armes.filter((x) => x.dispo === d.id)" :key="wd.id" :value="wd.id">
              {{ wd.nom }} ({{ wd.pg }} PG)
            </option>
          </optgroup>
        </select>
        <button type="submit" :disabled="!selectedDef || full" data-testid="weapon-add">Ajouter</button>
      </form>
      <form class="add-module" @submit.prevent="addCustom">
        <input v-model="customName" placeholder="Arme personnalisée…" data-testid="weapon-custom-name" :disabled="full" />
        <select v-model="customType" class="level-select" aria-label="Type">
          <option value="contact">Contact</option>
          <option value="distance">Distance</option>
        </select>
        <button type="submit" :disabled="full" data-testid="weapon-custom-add">Ajouter</button>
      </form>
    </div>
    <p v-if="selectedDef" class="hint">
      <template v-for="(pr, i) in selectedDef.profils" :key="i">
        <strong>{{ pr.nom }}</strong> {{ formatDice(pr.degats) }} / {{ formatDice(pr.violence) }}, {{ pr.portee }} — {{ formatEffects(pr.effets) || 'aucun effet' }}<br />
      </template>
      <span class="muted">{{ selectedDef.source }}</span>
    </p>
    <p v-if="message" class="error-text" role="alert" data-testid="weapon-message">{{ message }}</p>

    <ul class="module-list weapon-cards" data-testid="weapon-list">
      <li v-for="w in c.armes" :key="w.uid" class="weapon-card" :class="w.profils[0]?.type ?? 'contact'" data-testid="weapon-item">
        <Collapsible :title="w.nom" :storage-key="`arme.${w.uid}`">
          <template #summary>
            <span class="weapon-summary" data-testid="weapon-summary">
              <template v-if="w.profils.length <= 2">
                <span v-for="(pr, i) in w.profils" :key="i" class="weapon-summary-profile">
                  <span v-if="w.profils.length > 1" class="muted">{{ pr.nom }}</span>
                  <strong>{{ profileLine(pr) }}</strong>
                  <span class="chip">{{ pr.portee }}</span>
                </span>
              </template>
              <span v-else class="weapon-summary-profile">
                <strong>{{ w.profils.length }} profils</strong>
                <span class="muted">{{ w.profils.map((pr) => pr.nom).join(', ') }}</span>
                <span class="chip">{{ w.profils[0]?.portee }}</span>
              </span>
              <span v-if="w.legende" class="chip legend-chip">{{ legendLine(w) }}</span>
            </span>
          </template>
          <div class="weapon-body">
            <div class="effect-chips weapon-effects">
              <span v-for="(e, k) in lastEffects(w)" :key="k" class="chip" :class="{ custom: e.id === 'autre' }"
                :title="effectDescription(e, customEffects)">{{ effectLabel(e) }}</span>
            </div>
            <div class="module-head">
              <input class="module-name" :value="w.nom" aria-label="Nom de l’arme" @change="store.updateWeapon(w.uid, { nom: value($event) })" />
              <span class="muted small">{{ dispoOf(w) }}</span>
              <button type="button" class="ghost" :aria-label="`Retirer ${w.nom}`" data-testid="weapon-remove" @click="store.removeWeapon(w.uid)">✕</button>
            </div>
            <div v-for="(pr, i) in w.profils" :key="i" class="weapon-profile" :data-testid="`weapon-profile-${i}`">
              <input class="wp-name" :value="pr.nom" aria-label="Profil" @change="patch(w, i, { nom: value($event) })" />
              <select :value="pr.type" aria-label="Type" @change="patch(w, i, { type: value($event) as 'contact' | 'distance' })">
                <option value="contact">Contact</option>
                <option value="distance">Distance</option>
              </select>
              <label class="inline">Dégâts
                <input class="wp-dice" :value="formatDice(pr.degats)" data-testid="weapon-degats" @change="patch(w, i, { degats: parseDice(value($event)) })" />
              </label>
              <label class="inline">Violence
                <input class="wp-dice" :value="formatDice(pr.violence)" @change="patch(w, i, { violence: parseDice(value($event)) })" />
              </label>
              <select :value="pr.portee" aria-label="Portée" @change="patch(w, i, { portee: value($event) as Portee })">
                <option v-for="po in PORTEES" :key="po" :value="po">{{ po }}</option>
              </select>
              <input class="wp-effects" :value="formatEffects(pr.effets)" placeholder="effets (ex. meurtrier, choc 1)" aria-label="Effets"
                data-testid="weapon-effets" @change="patch(w, i, { effets: parseEffects(value($event), customEffects) })" />
              <span v-if="pr.energie" class="chip energy" :title="pr.energie">PE : {{ pr.energie }}</span>
            </div>
            <Collapsible v-if="w.legende" title="Arsenal de légende" :storage-key="`arme.${w.uid}.legende`" class="nested" data-testid="legend-section">
              <template #summary><span>{{ legendLine(w) }}</span></template>
              <LegendTree :weapon="w" />
            </Collapsible>
            <Collapsible :title="`Améliorations (${w.ameliorations.length})`" :storage-key="`arme.${w.uid}.ameliorations`" class="nested">
              <div class="upgrades">
                <label v-for="u in upgradesFor(w)" :key="u.id" :title="`${u.effet} — ${u.source}`">
                  <input type="checkbox" :checked="w.ameliorations.includes(u.id)" :data-testid="`upgrade-${u.id}`"
                    @change="store.toggleWeaponUpgrade(w.uid, u.id)" />
                  {{ u.nom }} <span class="muted">({{ u.pg }} PG)</span>
                </label>
              </div>
            </Collapsible>
            <textarea class="module-effect" rows="2" :value="w.notes" placeholder="Notes" aria-label="Notes"
              @change="store.updateWeapon(w.uid, { notes: ($event.target as HTMLTextAreaElement).value })"></textarea>
          </div>
        </Collapsible>
      </li>
      <li v-if="!c.armes.length" class="muted">Aucune arme. Les mains nues restent disponibles dans le panneau Attaque.</li>
    </ul>
  </section>
</template>
