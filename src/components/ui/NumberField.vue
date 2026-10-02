<script setup lang="ts">
import { computed } from 'vue'

/**
 * Champ numérique compact à saisie directe (sans boutons − / +).
 * Une saisie vide ou invalide rétablit la valeur ; une saisie hors bornes est ramenée dans les bornes.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    /** Nombre de chiffres attendus : fixe la largeur du champ (2 à 5). */
    digits?: 2 | 3 | 4 | 5
    label: string
  }>(),
  { min: 0, max: undefined, digits: 2 },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const widthClass = computed(() => `w-${props.digits}ch`)

function commit(event: Event): void {
  const el = event.target as HTMLInputElement
  const raw = el.value.trim()
  const parsed = Number(raw)
  if (raw === '' || !Number.isFinite(parsed)) {
    el.value = String(props.modelValue)
    return
  }
  let value = Math.trunc(parsed)
  if (props.min !== undefined) value = Math.max(props.min, value)
  if (props.max !== undefined) value = Math.min(props.max, value)
  el.value = String(value)
  if (value !== props.modelValue) emit('update:modelValue', value)
}
</script>

<template>
  <input
    type="number"
    class="number-field"
    :class="widthClass"
    :value="modelValue"
    :min="min"
    :max="max"
    :aria-label="label"
    inputmode="numeric"
    @change="commit"
  />
</template>
