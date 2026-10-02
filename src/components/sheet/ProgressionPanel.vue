<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { ASPECTS, CARAC_LABELS } from '../../rules/catalog'
import {
  checkAspect,
  checkCarac,
  checkOd,
  checkPurchase,
  missionGains,
  odLevel,
  refusalText,
  renommee,
  type UpgradeCheck,
} from '../../rules/progression'
import { MODULES, findModule, moduleCostToLevel } from '../../data/modules'
import { WEAPONS, findWeapon } from '../../data/weapons'
import type { AspectId, CaracId, Disponibilite } from '../../rules/types'
import HistoryList from './HistoryList.vue'

const store = useCharactersStore()
const c = computed(() => store.active)
const rules = computed(() => store.rules)

// --- Fin de mission ---
const missionNom = ref('')
const objectif = ref(true)
const secondaires = ref(0)
const parties = ref(1)
const heroiques = ref(0)
const pgObjectif = ref(15)
const proposition = computed(() =>
  missionGains(
    { objectifAtteint: objectif.value, secondaires: secondaires.value, parties: parties.value, heroiques: heroiques.value, pgObjectif: pgObjectif.value },
    rules.value,
  ),
)
const pxGain = ref(proposition.value.px)
const pgGain = ref(proposition.value.pg)
watch(proposition, (p) => {
  pxGain.value = p.px
  pgGain.value = p.pg
})

function validerMission(): void {
  store.endMission(missionNom.value ? `Mission « ${missionNom.value} »` : 'Fin de mission', pxGain.value, pgGain.value)
  missionNom.value = ''
  secondaires.value = 0
  parties.value = 1
  heroiques.value = 0
}

// --- Achats et refus ---
interface Refus {
  check: UpgradeCheck
  retry: () => void
}
const refus = ref<Refus | null>(null)

function tenter(result: UpgradeCheck | null, retry: () => UpgradeCheck | null): void {
  if (!result) return
  refus.value = result.ok ? null : { check: result, retry: () => { retry(); refus.value = null } }
}

const aspectCheck = (a: AspectId) => checkAspect(c.value!, a, rules.value)
const caracCheck = (k: CaracId) => checkCarac(c.value!, k, rules.value)
const odCheck = (k: CaracId) => checkOd(c.value!, k, rules.value)

function plusAspect(a: AspectId): void {
  tenter(store.buyAspect(a), () => store.buyAspect(a, true))
}
function plusCarac(k: CaracId): void {
  tenter(store.buyCarac(k), () => store.buyCarac(k, true))
}
function plusOd(k: CaracId): void {
  tenter(store.buyOd(k), () => store.buyOd(k, true))
}

const moduleId = ref('')
const moduleNiveau = ref(1)
const moduleDef = computed(() => findModule(moduleId.value))
const moduleCheck = computed(() => {
  const def = moduleDef.value
  if (!def || !c.value) return null
  const lvl = Math.min(moduleNiveau.value, def.niveaux.length)
  return checkPurchase(c.value, def.nom, moduleCostToLevel(def, lvl), def.niveaux[lvl - 1]!.dispo, rules.value)
})
function acheterModule(): void {
  const id = moduleId.value
  const lvl = moduleNiveau.value
  tenter(store.buyModule(id, lvl), () => store.buyModule(id, lvl, true))
  if (!refus.value) moduleId.value = ''
}

const weaponId = ref('')
const weaponCheck = computed(() => {
  const def = findWeapon(weaponId.value)
  return def && c.value ? checkPurchase(c.value, def.nom, def.pg, def.dispo, rules.value) : null
})
function acheterArme(): void {
  const id = weaponId.value
  tenter(store.buyWeapon(id), () => store.buyWeapon(id, true))
  if (!refus.value) weaponId.value = ''
}

const autreNom = ref('')
const autreCout = ref(0)
function acheterAutre(): void {
  tenter(store.buyOther(autreNom.value, autreCout.value), () => store.buyOther(autreNom.value, autreCout.value, true))
  if (!refus.value) {
    autreNom.value = ''
    autreCout.value = 0
  }
}

const DISPO: Record<Disponibilite, string> = { standard: 'S', avance: 'A', rare: 'R', prestige: 'P' }

function num(event: Event): number {
  return Math.max(0, Math.trunc(Number((event.target as HTMLInputElement).value) || 0))
}
</script>

<template>
  <div v-if="c" class="progression" data-testid="progression-panel">
    <section class="panel" aria-labelledby="soldes-title">
      <h3 id="soldes-title">Progression <small class="muted">· {{ renommee(c, rules) }}</small></h3>
      <div class="soldes">
        <label>PX disponibles <input type="number" min="0" :value="c.progression.pxActuel" data-testid="prog-px" @change="store.adjustProgression('pxActuel', num($event))" /></label>
        <label>PX totaux <input type="number" min="0" :value="c.progression.pxTotal" data-testid="prog-px-total" @change="store.adjustProgression('pxTotal', num($event))" /></label>
        <label>PG disponibles <input type="number" min="0" :value="c.progression.pgSolde" data-testid="prog-pg" @change="store.adjustProgression('pgSolde', num($event))" /></label>
        <label>PG gagnés (total) <input type="number" min="0" :value="c.progression.pgTotal" data-testid="prog-pg-total" @change="store.adjustProgression('pgTotal', num($event))" /></label>
      </div>

      <details class="mission" data-testid="mission">
        <summary>Fin de mission…</summary>
        <div class="form-grid mission-grid">
          <label class="wide">Mission <input v-model="missionNom" placeholder="Nom de la mission" data-testid="mission-nom" /></label>
          <label class="check"><input v-model="objectif" type="checkbox" data-testid="mission-objectif" /> Objectif principal atteint</label>
          <label>Objectifs secondaires <input v-model.number="secondaires" type="number" min="0" data-testid="mission-secondaires" /></label>
          <label>Parties jouées <input v-model.number="parties" type="number" min="1" data-testid="mission-parties" /></label>
          <label>Modes héroïques <input v-model.number="heroiques" type="number" min="0" data-testid="mission-heroiques" /></label>
          <label v-if="objectif">PG de l’objectif ({{ rules.progression.pgObjectifMin }}–{{ rules.progression.pgObjectifMax }})
            <input v-model.number="pgObjectif" type="number" :min="rules.progression.pgObjectifMin" :max="rules.progression.pgObjectifMax" />
          </label>
          <label>PX gagnés <input v-model.number="pxGain" type="number" min="0" data-testid="mission-px" /></label>
          <label>PG gagnés <input v-model.number="pgGain" type="number" min="0" data-testid="mission-pg" /></label>
        </div>
        <p class="hint">Proposé : {{ proposition.px }} PX et {{ proposition.pg }} PG (modifiables).</p>
        <button type="button" class="primary" data-testid="mission-valider" @click="validerMission">Valider les gains</button>
      </details>
    </section>

    <div v-if="refus" class="notice error" role="alert" data-testid="prog-refus">
      <strong>{{ refus.check.libelle }} ({{ refus.check.cout }} {{ refus.check.devise }}) :</strong> {{ refusalText(refus.check) }}.
      <button v-if="refus.check.forcable" type="button" class="small-inline" data-testid="prog-outrepasser" @click="refus.retry()">Passer outre</button>
      <button type="button" class="small-inline ghost" @click="refus = null">Fermer</button>
    </div>

    <section class="panel" aria-labelledby="ameliorer-title">
      <h4 id="ameliorer-title">Améliorer <small class="muted">(aspects et caractéristiques en PX, overdrives en PG)</small></h4>
      <div class="upgrade-grid">
        <div v-for="a in ASPECTS" :key="a.id" class="upgrade-aspect" :data-testid="`up-aspect-${a.id}`">
          <div class="upgrade-row aspect-row">
            <strong>{{ a.nom }} {{ c.aspects[a.id] }}</strong>
            <button type="button" :class="{ warn: !aspectCheck(a.id).ok }" :title="refusalText(aspectCheck(a.id))"
              :data-testid="`up-aspect-${a.id}-btn`" @click="plusAspect(a.id)">
              +1 · {{ aspectCheck(a.id).cout }} PX
            </button>
          </div>
          <div v-for="k in a.caracs" :key="k" class="upgrade-row">
            <span>{{ CARAC_LABELS[k] }} {{ c.caracs[k].val }}</span>
            <button type="button" :class="{ warn: !caracCheck(k).ok }" :title="refusalText(caracCheck(k))"
              :data-testid="`up-carac-${k}`" @click="plusCarac(k)">+1 · {{ caracCheck(k).cout }} PX</button>
            <span class="muted">OD {{ odLevel(c, k) }}</span>
            <button type="button" :class="{ warn: !odCheck(k).ok }" :title="refusalText(odCheck(k))"
              :data-testid="`up-od-${k}`" @click="plusOd(k)">+1 · {{ odCheck(k).cout }} PG</button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel" aria-labelledby="achats-title">
      <h4 id="achats-title">Acheter en PG</h4>
      <div class="add-module">
        <select v-model="moduleId" data-testid="buy-module" @change="moduleNiveau = 1">
          <option value="">— Module —</option>
          <option v-for="m in MODULES" :key="m.id" :value="m.id">{{ m.nom }} ({{ DISPO[m.niveaux[0]!.dispo] }})</option>
        </select>
        <select v-if="moduleDef && moduleDef.niveaux.length > 1" v-model.number="moduleNiveau" class="level-select" data-testid="buy-module-level">
          <option v-for="l in moduleDef.niveaux" :key="l.niveau" :value="l.niveau">Niv {{ l.niveau }}</option>
        </select>
        <button type="button" :disabled="!moduleCheck" :class="{ warn: moduleCheck && !moduleCheck.ok }" data-testid="buy-module-btn" @click="acheterModule">
          {{ moduleCheck ? `${moduleCheck.cout} PG` : 'Acheter' }}
        </button>
      </div>
      <div class="add-module">
        <select v-model="weaponId" data-testid="buy-weapon">
          <option value="">— Arme —</option>
          <option v-for="w in WEAPONS" :key="w.id" :value="w.id">{{ w.nom }} ({{ DISPO[w.dispo] }})</option>
        </select>
        <button type="button" :disabled="!weaponCheck" :class="{ warn: weaponCheck && !weaponCheck.ok }" data-testid="buy-weapon-btn" @click="acheterArme">
          {{ weaponCheck ? `${weaponCheck.cout} PG` : 'Acheter' }}
        </button>
      </div>
      <div class="add-module">
        <input v-model="autreNom" placeholder="Autre achat (implant, amélioration…)" data-testid="buy-other-name" />
        <input v-model.number="autreCout" type="number" min="0" class="cost-input" aria-label="Coût en PG" data-testid="buy-other-cost" />
        <button type="button" data-testid="buy-other-btn" @click="acheterAutre">Acheter</button>
      </div>
      <p class="hint">
        Préréglages :
        <button type="button" class="small-inline" @click="autreNom = 'Implant cybernétique'; autreCout = rules.progression.implant">Implant ({{ rules.progression.implant }} PG)</button>
        <button type="button" class="small-inline" @click="autreNom = 'Thérapie de reconstruction'; autreCout = rules.progression.therapie">Thérapie ({{ rules.progression.therapie }} PG)</button>
      </p>
    </section>

    <HistoryList />
  </div>
</template>
