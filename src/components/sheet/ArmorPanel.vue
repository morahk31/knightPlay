<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { useRulesStore } from '../../stores/rules'
import { ASPECTS, CARAC_LABELS } from '../../rules/catalog'
import {
  CUSTOM_ARMOR,
  NO_ARMOR,
  SLOT_LABELS,
  SLOT_ZONES,
  armorStatus,
  armorTotals,
  effectiveCdf,
  hasArmor,
  isEvolutionUnlocked,
  slotUsage,
} from '../../rules/armor'
import type { AspectId, CaracId, SlotZone } from '../../rules/types'

const store = useCharactersStore()
const rulesStore = useRulesStore()
const c = computed(() => store.active)

const generations = computed(() => [...new Set(rulesStore.catalogs.armures.map((a) => a.generation))].sort())
const totals = computed(() => (c.value ? armorTotals(c.value) : null))
const usage = computed(() => (c.value ? slotUsage(c.value) : null))
const status = computed(() => (c.value ? armorStatus(c.value) : 'aucune'))

function num(event: Event): number {
  return Math.max(0, Math.trunc(Number((event.target as HTMLInputElement).value) || 0))
}

function onModel(event: Event): void {
  store.setArmorModel((event.target as HTMLSelectElement).value)
}

function setSlot(zone: SlotZone, event: Event): void {
  if (!c.value) return
  store.updateArmor({ slots: { ...c.value.armure.slots, [zone]: num(event) } })
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
</script>

<template>
  <section v-if="c" class="panel" aria-labelledby="armor-title" data-testid="armor-panel">
    <h3 id="armor-title">Méta-armure</h3>

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
          <button type="button" data-testid="armor-deploy" :class="{ active: c.armure.etat === 'deployee' }" @click="store.setArmorEtat('deployee')">Déployée</button>
          <button type="button" data-testid="armor-fold" :class="{ active: c.armure.etat === 'repliee' }" @click="store.setArmorEtat('repliee')">Repliée</button>
          <span class="status" :class="status" data-testid="armor-status">
            {{ status === 'deployee' ? 'Déployée' : 'Repliée — combinaison Guardian' }}
          </span>
        </div>
      </template>
    </div>

    <p v-if="!hasArmor(c)" class="hint">
      Sans méta-armure choisie, les totaux d’armure et d’énergie se saisissent dans les jauges, et les OD de la fiche comptent tels quels.
    </p>

    <template v-else>
      <p v-if="c.armure.aVerifier" class="notice-inline" data-testid="armor-verify">
        ⚠ Slots et OD de base extraits de schémas du livre : à vérifier. Toutes les valeurs sont modifiables.
      </p>
      <p v-if="c.armure.notes" class="hint">{{ c.armure.notes }}</p>

      <div class="armor-stats">
        <label>
          PA de base
          <input type="number" min="0" data-testid="armor-pa" :value="c.armure.pa" @change="store.updateArmor({ pa: num($event) })" />
          <small>total {{ totals?.pa }}</small>
        </label>
        <label>
          PE de base
          <input type="number" min="0" data-testid="armor-pe" :value="c.armure.pe" @change="store.updateArmor({ pe: num($event) })" />
          <small>total {{ totals?.pe }}</small>
        </label>
        <label>
          CdF de base
          <input type="number" min="0" data-testid="armor-cdf" :value="c.armure.cdf" @change="store.updateArmor({ cdf: num($event) })" />
          <small>effectif {{ effectiveCdf(c, store.rules) }}</small>
        </label>
        <label>
          PA Guardian
          <input type="number" min="0" :max="store.rules.armure.guardianPa" data-testid="armor-guardian" :value="c.armure.guardianPa"
            @change="store.updateArmor({ guardianPa: Math.min(num($event), store.rules.armure.guardianPa) })" />
          <small>/ {{ store.rules.armure.guardianPa }} · CdF {{ store.rules.armure.guardianCdf }}</small>
        </label>
      </div>

      <h4>Slots</h4>
      <div class="slots-grid" data-testid="armor-slots">
        <label v-for="zone in SLOT_ZONES" :key="zone" :class="{ warn: usage?.[zone].over }" :data-testid="`slot-${zone}`">
          {{ SLOT_LABELS[zone] }}
          <span class="slot-line">
            <span :data-testid="`slot-${zone}-used`">{{ usage?.[zone].used }}</span> /
            <input type="number" min="0" :value="c.armure.slots[zone]" @change="setSlot(zone, $event)" />
            <small v-if="usage && usage[zone].max !== c.armure.slots[zone]">({{ usage[zone].max }})</small>
          </span>
        </label>
      </div>

      <h4>Overdrives de base de l’armure</h4>
      <div class="armor-od">
        <div v-for="a in ASPECTS" :key="a.id" class="armor-od-col">
          <strong>{{ a.nom }}</strong>
          <label v-for="carac in a.caracs" :key="carac">
            {{ CARAC_LABELS[carac] }}
            <input type="number" min="0" :data-testid="`armor-od-${carac}`" :value="odOf(carac)"
              @change="store.setArmorOd(carac, num($event))" />
          </label>
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

      <h4>Capacités</h4>
      <ul class="capacities">
        <li v-for="cap in c.armure.capacites" :key="cap.id">
          <strong>{{ cap.nom }}</strong> — <span class="muted">{{ cap.energie }} · {{ cap.activation }} · {{ cap.duree }}</span>
          <div class="hint">{{ cap.effet }}</div>
        </li>
        <li v-if="!c.armure.capacites.length" class="muted">Aucune capacité renseignée.</li>
      </ul>

      <h4>
        Évolutions
        <label class="inline">
          PG totaux
          <input type="number" min="0" data-testid="pg-total" :value="c.progression.pgTotal" @change="store.setPgTotal(num($event))" />
        </label>
      </h4>
      <ul class="evolutions" data-testid="armor-evolutions">
        <li v-for="(e, i) in c.armure.evolutions" :key="i" :class="{ unlocked: isEvolutionUnlocked(c, e.pg, e.achetee) }">
          <span class="evo-pg">{{ e.achetee ? `${e.pg} PG (achat)` : `${e.pg} PG` }}</span>
          <span>{{ isEvolutionUnlocked(c, e.pg, e.achetee) ? '✓' : '·' }} {{ e.effet }}</span>
        </li>
      </ul>
    </template>
  </section>
</template>
