<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { useLogStore } from '../../stores/log'
import { rollD6, type Rng } from '../../rules/dice'
import { parseDice } from '../../data/weapons'
import { describeSoak, soak, type IncomingHit, type SoakResult, type SoakTarget } from '../../rules/soak'

const props = defineProps<{ rng?: Rng }>()

const store = useCharactersStore()
const log = useLogStore()
const c = computed(() => store.active)

const degats = ref<number | ''>('')
const jet = ref('')
const ignoreCdf = ref(false)
const penetrant = ref(0)
const ignoreArmure = ref(false)
const perceArmure = ref(0)
const bonusCdf = ref(0)
const cible = ref<SoakTarget>('sante')

const applied = ref<SoakResult | null>(null)
const message = ref<string | null>(null)

const hit = computed<IncomingHit>(() => ({
  degats: Number(degats.value) || 0,
  ignoreCdf: ignoreCdf.value,
  penetrant: penetrant.value || 0,
  ignoreArmure: ignoreArmure.value,
  perceArmure: perceArmure.value || 0,
  bonusCdf: bonusCdf.value || 0,
  cible: cible.value,
}))

/** Aperçu de la répartition avant validation. */
const preview = computed(() => (c.value && degats.value !== '' ? soak(c.value, hit.value, store.rules) : null))
const canUndo = computed(() => !!store.lastSoak && store.lastSoak.characterId === c.value?.id)
const agonie = computed(() => !!applied.value?.agonie && (c.value?.jauges.sante.actuel ?? 1) === 0)

function lancer(): void {
  const d = parseDice(jet.value)
  if (!d.des && !d.fixe) {
    message.value = 'Jet invalide (ex. 3D6+6).'
    return
  }
  message.value = null
  degats.value = rollD6(d.des, props.rng).reduce((a, b) => a + b, 0) + d.fixe
}

function appliquer(): void {
  if (degats.value === '') {
    message.value = 'Indiquez les dégâts reçus.'
    return
  }
  const result = store.takeHit(hit.value)
  if (!result) return
  applied.value = result
  message.value = null
  log.add({ kind: 'info', title: 'Encaisser', detail: describeSoak(result), outcome: result.agonie ? 'critique' : 'info' })
  degats.value = ''
  jet.value = ''
}

function annuler(): void {
  if (store.undoSoak()) {
    log.add({ kind: 'info', title: 'Encaisser', detail: 'Dernier encaissement annulé.', outcome: 'info' })
    applied.value = null
    message.value = 'Dernier encaissement annulé.'
  }
}

function heroisme(): void {
  if (store.ignoreAgony()) {
    log.add({ kind: 'info', title: 'Héroïsme', detail: 'Agonie ignorée : 1 PS (−1 point d’héroïsme).', outcome: 'info' })
    applied.value = null
  } else {
    message.value = 'Pas de point d’héroïsme disponible.'
  }
}
</script>

<template>
  <section v-if="c" class="card soak-panel" aria-labelledby="soak-title" data-testid="soak-panel">
    <h3 id="soak-title">Encaisser</h3>
    <div class="form-grid">
      <label>
        Dégâts reçus
        <input v-model.number="degats" type="number" min="0" data-testid="soak-degats" />
      </label>
      <label>
        ou jet
        <span class="inline-roll">
          <input v-model="jet" placeholder="3D6+6" data-testid="soak-jet" @keydown.enter.prevent="lancer" />
          <button type="button" aria-label="Lancer les dégâts" data-testid="soak-roll" @click="lancer">🎲</button>
        </span>
      </label>
      <label>Pénétrant <input v-model.number="penetrant" type="number" min="0" data-testid="soak-penetrant" /></label>
      <label>Perce armure <input v-model.number="perceArmure" type="number" min="0" data-testid="soak-perce" /></label>
      <label>Bonus de CdF (le plus gros) <input v-model.number="bonusCdf" type="number" min="0" data-testid="soak-bonus-cdf" /></label>
      <label>
        Touche
        <select v-model="cible" data-testid="soak-cible">
          <option value="sante">Armure puis santé</option>
          <option value="espoir">Espoir (Anathème)</option>
          <option value="energie">Énergie (drain)</option>
        </select>
      </label>
    </div>
    <div class="checks-grid">
      <label><input v-model="ignoreCdf" type="checkbox" data-testid="soak-ignore-cdf" /> Ignore CdF</label>
      <label><input v-model="ignoreArmure" type="checkbox" data-testid="soak-ignore-armure" /> Ignore armure</label>
    </div>

    <p v-if="preview" class="preview soak-preview" data-testid="soak-preview">{{ preview.etapes.join(' → ') }}</p>

    <div class="attack-buttons">
      <button type="button" class="primary" data-testid="soak-apply" @click="appliquer">Appliquer</button>
      <button type="button" :disabled="!canUndo" data-testid="soak-undo" @click="annuler">Annuler</button>
    </div>
    <p v-if="message" class="hint" role="status" data-testid="soak-message">{{ message }}</p>

    <div v-if="agonie" class="notice error" role="alert" data-testid="soak-agonie">
      <strong>Agonie !</strong> Blessure aléatoire ; le personnage ne peut que ramper et doit être soigné.
      <button type="button" class="small-inline" :disabled="c.jauges.heroisme.actuel < 1" data-testid="soak-heroisme" @click="heroisme">
        1 point d’héroïsme : rester à 1 PS
      </button>
    </div>
    <p v-else-if="applied" class="hint" data-testid="soak-applied">Appliqué : {{ applied.etapes.join(' → ') }}</p>
  </section>
</template>
