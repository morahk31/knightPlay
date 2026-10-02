<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { useRulesStore } from '../../stores/rules'
import { ASPECTS, CARAC_LABELS } from '../../rules/catalog'
import { CUSTOM_ARMOR, NO_ARMOR, armorStatus, armorTotals, effectiveCdf, hasArmor, isEvolutionUnlocked } from '../../rules/armor'
import type { AspectId, CaracId } from '../../rules/types'
import NumberField from '../ui/NumberField.vue'
import StatTile from '../ui/StatTile.vue'
import SlotMap from './SlotMap.vue'

const store = useCharactersStore()
const rulesStore = useRulesStore()
const c = computed(() => store.active)

const generations = computed(() => [...new Set(rulesStore.catalogs.armures.map((a) => a.generation))].sort())
const totals = computed(() => (c.value ? armorTotals(c.value) : null))
const status = computed(() => (c.value ? armorStatus(c.value) : 'aucune'))

function onModel(event: Event): void {
  store.setArmorModel((event.target as HTMLSelectElement).value)
}

function toggleWarriorType(type: AspectId, checked: boolean): void {
  if (!c.value) return
  const types = new Set(c.value.armure.warriorTypes)
  if (checked) types.add(type)
  else types.delete(type)
  store.updateArmor({ warriorTypes: [...types] })
}

function odOf(carac: CaracId): number {
  return c.value?.armure.od[carac] ?? 0
}

/** État d'une évolution : acquise (débloquée par les PG ou achetée), à acheter, ou à venir. */
function evolutionState(e: { pg: number; achetee?: boolean; possedee?: boolean }): 'acquise' | 'achat' | 'avenir' {
  if (!c.value) return 'avenir'
  if (e.possedee || isEvolutionUnlocked(c.value, e.pg, e.achetee)) return 'acquise'
  return e.achetee ? 'achat' : 'avenir'
}

const EVOLUTION_LABEL = { acquise: 'Acquise', achat: 'À acheter', avenir: 'À débloquer' } as const
</script>

<template>
  <section v-if="c" class="panel armor-panel" aria-labelledby="armor-title" data-testid="armor-panel">
    <h3 id="armor-title" class="sr-only">Méta-armure</h3>

    <!-- (1) Modèle, nom, état -->
    <div class="armor-head">
      <label>
        Modèle
        <select data-testid="armor-model" :value="c.armure.modele" @change="onModel">
          <option :value="NO_ARMOR">— Aucune (totaux saisis à la main) —</option>
          <optgroup v-for="g in generations" :key="g" :label="`${g}ᵉ génération`">
            <option v-for="a in rulesStore.catalogs.armures.filter((x) => x.generation === g)" :key="a.id" :value="a.id">{{ a.nom }}</option>
          </optgroup>
          <option :value="CUSTOM_ARMOR">Personnalisée…</option>
        </select>
      </label>
      <template v-if="hasArmor(c)">
        <label>
          Nom
          <input :value="c.armure.nom" data-testid="armor-name" @change="store.updateArmor({ nom: ($event.target as HTMLInputElement).value })" />
        </label>
        <div class="armor-state" role="group" aria-label="État de l’armure">
          <button type="button" data-testid="armor-deploy" :class="{ active: c.armure.etat === 'deployee' }" :aria-pressed="c.armure.etat === 'deployee'"
            @click="store.setArmorEtat('deployee')">Déployée</button>
          <button type="button" data-testid="armor-fold" :class="{ active: c.armure.etat === 'repliee' }" :aria-pressed="c.armure.etat === 'repliee'"
            @click="store.setArmorEtat('repliee')">Repliée</button>
        </div>
        <span class="status-chip" :class="status" data-testid="armor-status">
          {{ status === 'deployee' ? 'Déployée' : 'Repliée — combinaison Guardian' }}
        </span>
        <span v-if="c.armure.aVerifier" class="verify-chip" data-testid="armor-verify" title="Toutes les valeurs restent modifiables.">
          Slots et OD extraits de schémas : à vérifier
        </span>
      </template>
    </div>

    <p v-if="!hasArmor(c)" class="hint">
      Sans méta-armure choisie, les totaux d’armure et d’énergie se saisissent dans les jauges, et les OD de la fiche comptent tels quels.
    </p>

    <template v-else>
      <p v-if="c.armure.notes" class="hint">{{ c.armure.notes }}</p>

      <!-- (2) Valeurs de l'armure -->
      <div class="armor-tiles">
        <StatTile label="Points d’armure" :value="totals!.pa" :note="totals!.pa !== c.armure.pa ? 'total, modules compris' : 'total'" accent="#9aa5b8">
          <label class="tile-field">base <NumberField :model-value="c.armure.pa" :digits="3" label="PA de base" data-testid="armor-pa"
            @update:model-value="store.updateArmor({ pa: $event })" /></label>
        </StatTile>
        <StatTile label="Points d’énergie" :value="totals!.pe" :note="totals!.pe !== c.armure.pe ? 'total, modules compris' : 'total'" accent="accent">
          <label class="tile-field">base <NumberField :model-value="c.armure.pe" :digits="3" label="PE de base" data-testid="armor-pe"
            @update:model-value="store.updateArmor({ pe: $event })" /></label>
        </StatTile>
        <StatTile label="Champ de force" :value="effectiveCdf(c, store.rules)" note="effectif" accent="gold">
          <label class="tile-field">base <NumberField :model-value="c.armure.cdf" :digits="3" label="CdF de base" data-testid="armor-cdf"
            @update:model-value="store.updateArmor({ cdf: $event })" /></label>
        </StatTile>
        <StatTile label="Guardian" :value="`${c.armure.guardianPa} PA`" :note="`sur ${store.rules.armure.guardianPa} · CdF ${store.rules.armure.guardianCdf} quand repliée`" accent="muted">
          <label class="tile-field">PA <NumberField :model-value="c.armure.guardianPa" :max="store.rules.armure.guardianPa" label="PA de la Guardian"
            data-testid="armor-guardian" @update:model-value="store.updateArmor({ guardianPa: $event })" /></label>
        </StatTile>
      </div>

      <!-- (3)(4) Slots et OD de base -->
      <div class="armor-columns">
        <div>
          <h4>Slots <small class="muted">· {{ c.modules.length }} module{{ c.modules.length > 1 ? 's' : '' }}</small></h4>
          <div data-testid="armor-slots"><SlotMap editable /></div>
        </div>
        <div>
          <h4>Overdrives de base de l’armure</h4>
          <div class="armor-od">
            <div v-for="a in ASPECTS" :key="a.id" class="armor-od-col">
              <strong>{{ a.nom }}</strong>
              <label v-for="carac in a.caracs" :key="carac" :class="{ on: odOf(carac) > 0 }">
                {{ CARAC_LABELS[carac] }}
                <NumberField :model-value="odOf(carac)" :label="`OD de base ${CARAC_LABELS[carac]}`" :data-testid="`armor-od-${carac}`"
                  @update:model-value="store.setArmorOd(carac, $event)" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <template v-if="c.armure.modele === 'warrior'">
        <h4>Types connus (Warrior)</h4>
        <div class="checks">
          <label v-for="a in ASPECTS" :key="a.id">
            <input type="checkbox" :data-testid="`warrior-type-${a.id}`" :checked="c.armure.warriorTypes.includes(a.id)"
              @change="toggleWarriorType(a.id, ($event.target as HTMLInputElement).checked)" />
            {{ a.nom }}
          </label>
        </div>
      </template>

      <!-- (5) Capacités -->
      <h4>Capacités</h4>
      <div class="capacity-cards" data-testid="armor-capacities">
        <div v-for="cap in c.armure.capacites" :key="cap.id" class="capacity-card">
          <div class="capacity-head">
            <strong>{{ cap.nom }}</strong>
            <span class="pe-badge">{{ cap.energie }}</span>
          </div>
          <span class="muted capacity-meta">{{ cap.activation }}<template v-if="cap.duree"> · {{ cap.duree }}</template></span>
          <span class="capacity-effect">{{ cap.effet }}</span>
        </div>
        <p v-if="!c.armure.capacites.length" class="muted">Aucune capacité renseignée.</p>
      </div>

      <!-- (6) Évolutions -->
      <h4 class="evolutions-head">
        Évolutions
        <label class="inline">
          PG gagnés
          <NumberField :model-value="c.progression.pgTotal" :digits="4" label="PG gagnés (total)" data-testid="pg-total"
            @update:model-value="store.setPgTotal($event)" />
        </label>
      </h4>
      <ul class="evolutions" data-testid="armor-evolutions">
        <li v-for="(e, i) in c.armure.evolutions" :key="i" :class="[evolutionState(e), { unlocked: evolutionState(e) === 'acquise' }]">
          <span class="evo-pg">{{ e.pg }} PG</span>
          <span class="evo-state">{{ EVOLUTION_LABEL[evolutionState(e)] }}</span>
          <span class="evo-effect">{{ e.effet }}</span>
          <button v-if="e.achetee && !e.possedee" type="button" class="small-inline" :data-testid="`evolution-buy-${i}`"
            :disabled="c.progression.pgSolde < e.pg" :title="c.progression.pgSolde < e.pg ? 'PG insuffisants' : ''"
            @click="store.buyEvolution(i)">Acheter</button>
        </li>
      </ul>
    </template>
  </section>
</template>
