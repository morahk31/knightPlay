<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { SLOT_LABELS, SLOT_ZONES, slotUsage } from '../../rules/armor'
import type { SlotZone } from '../../rules/types'
import NumberField from '../ui/NumberField.vue'

/** Silhouette des 6 zones de slots : occupés / total, barre, modules installés. */
const props = withDefaults(defineProps<{ editable?: boolean }>(), { editable: false })

const store = useCharactersStore()
const c = computed(() => store.active)
const usage = computed(() => (c.value ? slotUsage(c.value) : null))

function modulesIn(zone: SlotZone): string {
  return (c.value?.modules ?? [])
    .filter((m) => (m.slots[zone] ?? 0) > 0)
    .map((m) => ((m.slots[zone] ?? 0) > 1 ? `${m.nom} (${m.slots[zone]})` : m.nom))
    .join(', ')
}

function percent(zone: SlotZone): string {
  const u = usage.value?.[zone]
  if (!u || u.max <= 0) return u && u.used > 0 ? '100%' : '0%'
  return `${Math.min(100, Math.round((u.used / u.max) * 100))}%`
}

function setTotal(zone: SlotZone, value: number): void {
  if (!c.value || !props.editable) return
  store.updateArmor({ slots: { ...c.value.armure.slots, [zone]: value } })
}
</script>

<template>
  <div v-if="c && usage" class="slot-map" :class="{ editable }" role="group" aria-label="Slots de la méta-armure">
    <div
      v-for="zone in SLOT_ZONES"
      :key="zone"
      class="slot-zone"
      :class="[`zone-${zone}`, { over: usage[zone].over, full: !usage[zone].over && usage[zone].used > 0 && usage[zone].used === usage[zone].max }]"
      :data-testid="`slot-${zone}`"
    >
      <div class="slot-zone-head">
        <span class="slot-zone-name">{{ SLOT_LABELS[zone] }}</span>
        <span class="slot-zone-count">
          <strong :data-testid="`slot-${zone}-used`">{{ usage[zone].used }}</strong>
          /
          <NumberField
            v-if="editable"
            :model-value="c.armure.slots[zone]"
            :label="`Slots ${SLOT_LABELS[zone]} (total de l’armure)`"
            :data-testid="`slot-${zone}-total`"
            @update:model-value="setTotal(zone, $event)"
          />
          <strong v-else>{{ usage[zone].max }}</strong>
          <small v-if="editable && usage[zone].max !== c.armure.slots[zone]" class="muted" title="Bonus de masse de contrôle compris">({{ usage[zone].max }})</small>
        </span>
      </div>
      <div class="slot-bar"><span :style="{ width: percent(zone) }"></span></div>
      <span v-if="modulesIn(zone)" class="slot-zone-modules">{{ modulesIn(zone) }}</span>
    </div>
  </div>
</template>
