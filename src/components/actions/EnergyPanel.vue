<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { useLogStore } from '../../stores/log'
import { ASPECTS } from '../../rules/catalog'
import { armorStatus, armorSystemsOnline, hasArmor } from '../../rules/armor'
import { gaugeTotals } from '../../rules/derived'
import { rollD6, type Rng } from '../../rules/dice'
import type { NodKind } from '../../rules/energy'
import type { AspectId } from '../../rules/types'

const props = defineProps<{ rng?: Rng }>()

const store = useCharactersStore()
const log = useLogStore()
const c = computed(() => store.active)

/** Coûts personnalisés saisis avant activation (clé = identifiant de ligne). */
const costs = ref<Record<string, number>>({})
const nodValue = ref<number | ''>('')
const hours = ref(1)
const message = ref<{ kind: 'error' | 'info'; text: string } | null>(null)

interface Activable {
  key: string
  nom: string
  cout: number | null
  detail: string
}

const activables = computed<Activable[]>(() => {
  if (!c.value) return []
  const caps = c.value.armure.capacites
    .filter((cap) => cap.cout !== null)
    .map((cap) => ({ key: `cap-${cap.id}`, nom: cap.nom, cout: cap.cout, detail: `${cap.activation} · ${cap.duree}` }))
  const mods = c.value.modules
    .filter((m) => m.energie !== null)
    .map((m) => ({ key: `mod-${m.uid}`, nom: m.nom, cout: m.energie, detail: `${m.activation} · ${m.duree}` }))
  return [...caps, ...mods]
})

const totalEnergie = computed(() => (c.value ? gaugeTotals(c.value, store.rules).energie : 0))
const online = computed(() => (c.value ? armorSystemsOnline(c.value, store.rules) : false))

function costOf(a: Activable): number {
  return costs.value[a.key] ?? a.cout ?? 0
}

function report(ok: boolean, text: string, title: string): void {
  message.value = { kind: ok ? 'info' : 'error', text }
  if (ok) log.add({ kind: 'info', title, detail: text, outcome: 'info' })
}

function activate(a: Activable): void {
  const cost = costOf(a)
  const result = store.spend(cost)
  report(result.ok, result.ok ? `−${cost} PE (${a.detail})` : result.reason ?? 'Activation impossible.', `Activation : ${a.nom}`)
}

const knownTypes = computed<AspectId[]>(() =>
  c.value && c.value.armure.warriorTypes.length ? c.value.armure.warriorTypes : ASPECTS.map((a) => a.id),
)
const selectedType = ref<AspectId | ''>('')

function activateType(): void {
  if (!selectedType.value) return
  const result = store.spend(1)
  const label = ASPECTS.find((a) => a.id === selectedType.value)?.nom ?? ''
  if (result.ok) store.setWarriorType(selectedType.value)
  report(result.ok, result.ok ? `Type ${label} actif : −1 PE (à renouveler chaque tour)` : result.reason ?? '', 'Warrior : type')
}

function useNod(kind: NodKind): void {
  const value = nodValue.value === '' ? rollD6(store.rules.armure.nodDes, props.rng).reduce((a, b) => a + b, 0) : Number(nodValue.value)
  const result = store.nod(kind, value)
  const label = { energie: 'PE', armure: 'PA', soin: 'PS' }[kind]
  report(result.ok, result.ok ? `Nod (${value}) : +${result.amount} ${label}` : result.reason ?? '', `Nod ${kind === 'soin' ? 'de soin' : `d’${kind}`}`)
  nodValue.value = ''
}

function doRest(): void {
  const result = store.rest(hours.value)
  report(result.ok, result.ok ? `Repos ${hours.value} h : +${result.amount} PE` : result.reason ?? '', 'Repos')
}

function doFoldRest(): void {
  const result = store.foldRest()
  report(result.ok, result.ok ? `Armure repliée ${store.rules.armure.heuresRepliPlein} h : +${result.amount} PE (plein)` : result.reason ?? '', 'Repos replié')
}

function doNewMission(): void {
  store.newMission()
  report(true, 'Nods remis au maximum pour la mission.', 'Nouvelle mission')
}
</script>

<template>
  <section v-if="c" class="card energy-panel" aria-labelledby="energy-title" data-testid="energy-panel">
    <h3 id="energy-title">Modules / Énergie</h3>
    <p class="preview">
      Énergie <strong data-testid="energy-current">{{ c.jauges.energie.actuel }}</strong> / {{ totalEnergie }}
      <span v-if="hasArmor(c) && armorStatus(c) === 'repliee'" class="malus"> · armure repliée</span>
      <span v-else-if="hasArmor(c) && !online" class="malus"> · plus d’énergie : modules et OD inactifs</span>
    </p>

    <div v-if="c.armure.modele === 'warrior'" class="activable warrior-type" data-testid="warrior-type">
      <select v-model="selectedType" data-testid="warrior-type-select">
        <option value="">Type Warrior…</option>
        <option v-for="t in knownTypes" :key="t" :value="t">{{ ASPECTS.find((a) => a.id === t)?.nom }}</option>
      </select>
      <button type="button" :disabled="!selectedType" data-testid="warrior-type-activate" @click="activateType">1 PE</button>
      <button v-if="c.armure.warriorType" type="button" class="ghost" @click="store.setWarriorType(null)">Désactiver</button>
    </div>

    <ul class="activables" data-testid="activables">
      <li v-for="a in activables" :key="a.key" class="activable" :data-testid="`activable-${a.key}`">
        <span class="activable-name" :title="a.detail">{{ a.nom }}</span>
        <input type="number" min="0" :value="costOf(a)" aria-label="Coût en PE"
          @change="costs[a.key] = Math.max(0, Math.trunc(Number(($event.target as HTMLInputElement).value) || 0))" />
        <button type="button" :data-testid="`activate-${a.key}`" @click="activate(a)">Activer</button>
      </li>
      <li v-if="!activables.length" class="muted">Aucune capacité ni module à activer.</li>
    </ul>

    <div class="nods" data-testid="nods">
      <input v-model.number="nodValue" type="number" min="0" placeholder="valeur (vide = lancer)" data-testid="nod-value" />
      <button type="button" data-testid="nod-energie" @click="useNod('energie')">Énergie ({{ c.armure.nods.energie }})</button>
      <button type="button" data-testid="nod-armure" @click="useNod('armure')">Armure ({{ c.armure.nods.armure }})</button>
      <button type="button" data-testid="nod-soin" @click="useNod('soin')">Soin ({{ c.armure.nods.soin }})</button>
    </div>

    <div class="rest">
      <label class="inline">
        <input v-model.number="hours" type="number" min="1" data-testid="rest-hours" /> h
      </label>
      <button type="button" data-testid="rest" @click="doRest">Repos</button>
      <button type="button" data-testid="fold-rest" @click="doFoldRest">Repli {{ store.rules.armure.heuresRepliPlein }} h</button>
      <button type="button" class="ghost" data-testid="new-mission" @click="doNewMission">Nouvelle mission</button>
    </div>

    <p v-if="message" class="notice" :class="message.kind" role="status" data-testid="energy-message">{{ message.text }}</p>
  </section>
</template>
