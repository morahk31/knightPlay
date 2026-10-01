<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { useLogStore } from '../../stores/log'
import { ASPECTS, CARAC_LABELS } from '../../rules/catalog'
import { countSuccesses, parseFaces, rollD6, type Rng } from '../../rules/dice'
import {
  comboLabel,
  describeResult,
  planTest,
  resolveFromCount,
  resolveFromFaces,
  type TestInput,
  type TestResult,
} from '../../rules/test'
import type { CaracId, LogOutcome } from '../../rules/types'
import DiceModeToggle, { type DiceMode } from './DiceModeToggle.vue'
import RollResult from './RollResult.vue'

const props = defineProps<{
  /** Base proposée depuis la fiche (clic sur une caractéristique). */
  pendingBase?: CaracId | null
  /** Générateur aléatoire injectable (tests). */
  rng?: Rng
}>()

const store = useCharactersStore()
const log = useLogStore()

const base = ref<CaracId>(props.pendingBase ?? 'combat')
const combo = ref<CaracId | ''>('')
const extra = ref<CaracId | ''>('')
const modDes = ref(0)
const modReussites = ref(0)
const avecOd = ref(true)
const desSacrifies = ref(0)
/** Valeur de la liste : '' = aucune, 'libre' = saisie, sinon un niveau nommé. */
const difficultyChoice = ref<string>('3')
const customDifficulty = ref(3)

const mode = ref<DiceMode>('virtuel')
const saisieReussites = ref<number | ''>('')
const saisieFaces = ref('')
const saisieExploit = ref<number | ''>('')

const result = ref<TestResult | null>(null)
const erreur = ref<string | null>(null)

watch(
  () => props.pendingBase,
  (carac) => {
    if (!carac) return
    base.value = carac
    if (combo.value === carac) combo.value = ''
    if (extra.value === carac) extra.value = ''
  },
)

const difficulte = computed<number | null>(() => {
  if (difficultyChoice.value === '') return null
  if (difficultyChoice.value === 'libre') return Math.max(0, Math.trunc(customDifficulty.value || 0))
  return Number(difficultyChoice.value)
})

const input = computed<TestInput>(() => ({
  base: base.value,
  combo: combo.value || null,
  extra: extra.value || null,
  modDes: modDes.value || 0,
  modReussites: modReussites.value || 0,
  avecOd: avecOd.value,
  desSacrifies: desSacrifies.value || 0,
  difficulte: difficulte.value,
}))

const plan = computed(() => (store.active ? planTest(store.active, input.value, store.rules) : null))

const chanceText = computed(() =>
  plan.value?.chance === null || plan.value?.chance === undefined
    ? null
    : `${Math.round(plan.value.chance * 100)} %`,
)

/** Faces saisies, si le champ est rempli correctement. */
const parsedFaces = computed(() => (saisieFaces.value.trim() ? parseFaces(saisieFaces.value) : null))

/** En mode réel, faut-il demander la relance d'exploit ? */
const exploitAttendu = computed(() => {
  const p = plan.value
  if (!p || p.des === 0 || !store.rules.systeme.exploitRelance) return false
  if (parsedFaces.value) return parsedFaces.value.length === p.des && parsedFaces.value.every((f) => f % 2 === 0)
  return saisieReussites.value !== '' && Number(saisieReussites.value) >= p.des
})

const heroismeManquant = computed(
  () => input.value.extra !== null && (store.active?.jauges.heroisme.actuel ?? 0) < 1,
)

function outcomeOf(r: TestResult): LogOutcome {
  if (r.critique) return 'critique'
  if (r.exploit && r.reussi !== false) return 'exploit'
  if (r.reussi === true) return 'reussite'
  if (r.reussi === false) return 'echec'
  return 'info'
}

function lancer(): void {
  erreur.value = null
  const p = plan.value
  if (!p || !store.active) return
  if (p.erreurs.length) {
    erreur.value = p.erreurs.join(' ')
    return
  }
  if (heroismeManquant.value) {
    erreur.value = 'Pas assez de points d’héroïsme pour ajouter une 3ᵉ caractéristique.'
    return
  }

  let r: TestResult
  if (mode.value === 'virtuel') {
    const faces = rollD6(p.des, props.rng)
    const toutPair = p.des > 0 && faces.every((f) => f % 2 === 0)
    const relance = toutPair && store.rules.systeme.exploitRelance ? rollD6(p.des, props.rng) : null
    r = resolveFromFaces(p, faces, relance, store.rules)
  } else {
    let reussites: number
    let faces: number[] | null = null
    if (saisieFaces.value.trim()) {
      faces = parsedFaces.value
      if (!faces || faces.length !== p.des) {
        erreur.value = `Saisissez exactement ${p.des} faces entre 1 et 6.`
        return
      }
      reussites = countSuccesses(faces)
    } else {
      if (p.des > 0 && saisieReussites.value === '') {
        erreur.value = 'Indiquez le nombre de réussites (dés pairs) obtenues, ou les faces.'
        return
      }
      reussites = Number(saisieReussites.value) || 0
    }
    if (exploitAttendu.value && saisieExploit.value === '') {
      erreur.value = 'Exploit ! Indiquez les réussites obtenues sur la relance.'
      return
    }
    r = { ...resolveFromCount(p, reussites, Number(saisieExploit.value) || 0, store.rules), faces }
  }

  if (input.value.extra) store.adjustGauge('heroisme', -1)
  result.value = r
  log.add({ kind: 'test', title: `Test ${comboLabel(p)}`, detail: describeResult(r), outcome: outcomeOf(r) })
  saisieReussites.value = ''
  saisieFaces.value = ''
  saisieExploit.value = ''
}
</script>

<template>
  <section class="card test-panel" aria-labelledby="test-title" data-testid="test-panel">
    <h3 id="test-title">Test</h3>
    <template v-if="store.active && plan">
      <div class="form-grid">
        <label>
          Base
          <select v-model="base" data-testid="test-base">
            <optgroup v-for="a in ASPECTS" :key="a.id" :label="a.nom">
              <option v-for="c in a.caracs" :key="c" :value="c">
                {{ CARAC_LABELS[c] }} ({{ store.active.caracs[c].val }})
              </option>
            </optgroup>
          </select>
        </label>
        <label>
          Combo
          <select v-model="combo" data-testid="test-combo">
            <option value="">— aucune —</option>
            <optgroup v-for="a in ASPECTS" :key="a.id" :label="a.nom">
              <option v-for="c in a.caracs" :key="c" :value="c" :disabled="c === base">
                {{ CARAC_LABELS[c] }} ({{ store.active.caracs[c].val }})
              </option>
            </optgroup>
          </select>
        </label>
        <label class="wide">
          3ᵉ caractéristique (1 point d’héroïsme)
          <select v-model="extra" data-testid="test-extra">
            <option value="">— aucune —</option>
            <optgroup v-for="a in ASPECTS" :key="a.id" :label="a.nom">
              <option v-for="c in a.caracs" :key="c" :value="c" :disabled="c === base || c === combo">
                {{ CARAC_LABELS[c] }} ({{ store.active.caracs[c].val }})
              </option>
            </optgroup>
          </select>
        </label>
        <label>
          Dés ±
          <input v-model.number="modDes" type="number" data-testid="test-mod-des" />
        </label>
        <label>
          Réussites auto ±
          <input v-model.number="modReussites" type="number" data-testid="test-mod-reussites" />
        </label>
        <label>
          Difficulté
          <select v-model="difficultyChoice" data-testid="test-difficulte">
            <option value="">— aucune —</option>
            <option v-for="d in store.rules.systeme.difficultes" :key="d.value" :value="String(d.value)">
              {{ d.label }} ({{ d.value }})
            </option>
            <option value="libre">Autre (opposition)…</option>
          </select>
        </label>
        <label v-if="difficultyChoice === 'libre'">
          À dépasser
          <input v-model.number="customDifficulty" type="number" min="0" data-testid="test-difficulte-libre" />
        </label>
        <label v-if="store.rules.systeme.sacrificeDes">
          Dés sacrifiés (paires)
          <input v-model.number="desSacrifies" type="number" min="0" step="2" data-testid="test-sacrifice" />
        </label>
        <label class="check">
          <input v-model="avecOd" type="checkbox" data-testid="test-avec-od" />
          Compter les OD
        </label>
      </div>

      <p class="preview" data-testid="test-preview">
        <strong>{{ plan.des }}</strong> dé{{ plan.des > 1 ? 's' : '' }}
        + <strong>{{ plan.auto }}</strong> auto
        <span v-if="plan.malusEspoir" class="malus"> (désespoir −{{ plan.malusEspoir }})</span>
        <span v-if="chanceText" data-testid="test-chance"> · {{ chanceText }} de réussite</span>
        <span v-if="plan.des === 0" class="malus"> · échec automatique (0 dé)</span>
      </p>
      <p v-for="e in plan.erreurs" :key="e" class="error-text">{{ e }}</p>

      <DiceModeToggle v-model="mode" />
      <div v-if="mode === 'reel'" class="manual" data-testid="manual-inputs">
        <label>
          Réussites aux dés
          <input v-model.number="saisieReussites" type="number" min="0" :max="plan.des" data-testid="manual-reussites" />
        </label>
        <label>
          ou faces
          <input v-model="saisieFaces" placeholder="ex. 2 4 5 6" data-testid="manual-faces" />
        </label>
        <label v-if="exploitAttendu" class="wide">
          Exploit ! Réussites obtenues sur la relance
          <input v-model.number="saisieExploit" type="number" min="0" :max="plan.des" data-testid="manual-exploit" />
        </label>
      </div>

      <button type="button" class="primary" data-testid="test-roll" @click="lancer">
        {{ mode === 'virtuel' ? 'Lancer' : 'Valider le résultat' }}
      </button>
      <p v-if="erreur" class="error-text" role="alert" data-testid="test-error">{{ erreur }}</p>
      <RollResult v-if="result" :result="result" />
    </template>
  </section>
</template>
