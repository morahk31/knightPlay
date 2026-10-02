<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { chassisFor, findChassis, LEGEND_BASES } from '../../data/legend'
import { formatDice } from '../../data/weapons'
import { formatEffects } from '../../rules/effects'
import { boughtCount, legendInvestment, optimisationEtat, type OptimisationEtat } from '../../rules/legend'
import { refusalText, type UpgradeCheck } from '../../rules/progression'
import type { Disponibilite, LegendOptimisation, OwnedWeapon } from '../../rules/types'

const props = defineProps<{ weapon: OwnedWeapon }>()

const store = useCharactersStore()
const state = computed(() => props.weapon.legende!)
const chassis = computed(() => findChassis(state.value.chassisId))
const choices = computed(() => chassisFor(state.value.base))

const RARETES: { id: Disponibilite; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'avance', label: 'Avancé (100 PG gagnés)' },
  { id: 'rare', label: 'Rare (300 PG gagnés)' },
  { id: 'prestige', label: 'Prestige (500 PG gagnés)' },
]
const ETAT_LABEL: Record<OptimisationEtat, string> = {
  complete: 'acquise',
  disponible: 'disponible',
  'non-reliee': 'non reliée',
  rarete: 'rareté insuffisante',
}

const refus = ref<{ check: UpgradeCheck; retry: () => void } | null>(null)

function tenter(result: UpgradeCheck | null, retry: () => UpgradeCheck | null): void {
  if (!result) return
  refus.value = result.ok ? null : { check: result, retry: () => { retry(); refus.value = null } }
}

function acheterChassis(id: string): void {
  tenter(store.buyChassis(props.weapon.uid, id), () => store.buyChassis(props.weapon.uid, id, true))
}

function acheter(opt: LegendOptimisation): void {
  tenter(store.buyOptimisation(props.weapon.uid, opt.id), () => store.buyOptimisation(props.weapon.uid, opt.id, true))
}

function etat(opt: LegendOptimisation): OptimisationEtat {
  return store.active && chassis.value ? optimisationEtat(store.active, chassis.value, state.value, opt, store.rules) : 'non-reliee'
}

function coutLabel(opt: LegendOptimisation): string {
  const n = boughtCount(state.value, opt.id)
  if (opt.couts.length === 1) return n ? '✓' : `${opt.couts[0]} PG`
  const next = opt.couts[n]
  return `${n}/${opt.couts.length}${next !== undefined ? ` · ${next} PG` : ''}`
}

function detail(opt: LegendOptimisation): string {
  const bits: string[] = []
  const b = opt.bonus
  if (b?.degatsDes) bits.push(`+${b.degatsDes}D6 dégâts`)
  if (b?.degatsFixe) bits.push(`+${b.degatsFixe} dégâts`)
  if (b?.violenceDes) bits.push(`+${b.violenceDes}D6 violence`)
  if (b?.violenceFixe) bits.push(`+${b.violenceFixe} violence`)
  if (opt.effet) bits.push(opt.effet)
  if (opt.remplace) bits.push(`remplace ${opt.remplace}`)
  if (opt.retire) bits.push(`supprime ${opt.retire.join(', ')}`)
  if (opt.portee) bits.push(`portée ${opt.portee}`)
  if (opt.texte) bits.push(opt.texte)
  return bits.join(' · ')
}
</script>

<template>
  <div class="legend" data-testid="legend-tree">
    <template v-if="!chassis">
      <p class="hint">
        {{ state.base === 'longbow' ? 'Longbow' : LEGEND_BASES[state.base].nom }} : choisissez un châssis (un seul, définitif) pour obtenir la forme optimisée.
      </p>
      <ul class="legend-chassis">
        <li v-for="ch in choices" :key="ch.id">
          <strong>{{ ch.nom }}</strong> — {{ formatDice(ch.profil.degats) }}{{ ch.profil.type === 'contact' ? ' + Force' : '' }} / {{ formatDice(ch.profil.violence) }},
          {{ ch.profil.portee }}, {{ formatEffects(ch.profil.effets) }}
          <span class="muted">({{ ch.description }})</span>
          <button type="button" class="small-inline" :data-testid="`legend-chassis-${ch.id}`" @click="acheterChassis(ch.id)">{{ ch.pg }} PG</button>
        </li>
      </ul>
    </template>

    <template v-else>
      <p class="hint">
        <strong>{{ chassis.nom }}</strong> · {{ legendInvestment(state) }} PG investis · {{ chassis.source }}.
        Une optimisation se débloque quand elle est reliée au châssis ou à une optimisation acquise, et que la rareté est atteinte.
      </p>
      <div v-for="r in RARETES" :key="r.id" class="legend-row" :class="r.id">
        <span class="legend-row-label">{{ r.label }}</span>
        <div class="legend-opts">
          <button v-for="opt in chassis.optimisations.filter((o) => o.rarete === r.id)" :key="opt.id" type="button"
            class="legend-opt" :class="etat(opt)" :title="`${detail(opt)} — ${ETAT_LABEL[etat(opt)]}`"
            :data-testid="`legend-opt-${opt.id}`" :disabled="etat(opt) === 'complete'" @click="acheter(opt)">
            <span class="legend-opt-name">{{ opt.nom }}</span>
            <span class="legend-opt-cost">{{ coutLabel(opt) }}</span>
          </button>
        </div>
      </div>
      <p class="hint legend-legend">
        <span class="legend-opt complete">acquise</span>
        <span class="legend-opt disponible">disponible</span>
        <span class="legend-opt non-reliee">non reliée</span>
        <span class="legend-opt rarete">rareté insuffisante</span>
      </p>
    </template>

    <div v-if="refus" class="notice error" role="alert" data-testid="legend-refus">
      <strong>{{ refus.check.libelle }} ({{ refus.check.cout }} PG) :</strong> {{ refusalText(refus.check) }}.
      <button v-if="refus.check.forcable" type="button" class="small-inline" data-testid="legend-outrepasser" @click="refus.retry()">Passer outre</button>
      <button type="button" class="small-inline ghost" @click="refus = null">Fermer</button>
    </div>
  </div>
</template>
