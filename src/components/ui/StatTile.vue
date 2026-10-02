<script setup lang="ts">
/** Grande valeur lisible d'un coup d'œil : libellé, valeur, note, accent de couleur. */
withDefaults(
  defineProps<{
    label: string
    value: string | number
    note?: string
    /** Couleur d'accent : une couleur du thème ou une valeur CSS. */
    accent?: 'accent' | 'gold' | 'danger' | 'ok' | 'muted' | string
    /** Identifiant de test de la valeur. */
    valueTestid?: string
  }>(),
  { note: undefined, accent: 'accent', valueTestid: 'stat-tile-value' },
)

const THEME = ['accent', 'gold', 'danger', 'ok', 'muted']
</script>

<template>
  <div class="stat-tile" :style="{ '--tile-accent': THEME.includes(accent) ? `var(--${accent})` : accent }">
    <span class="stat-tile-label">{{ label }}</span>
    <span class="stat-tile-value" :data-testid="valueTestid">{{ value }}</span>
    <span v-if="note" class="stat-tile-note">{{ note }}</span>
    <div v-if="$slots.default" class="stat-tile-extra"><slot /></div>
  </div>
</template>
