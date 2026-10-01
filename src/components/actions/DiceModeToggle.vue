<script lang="ts">
export type DiceMode = 'virtuel' | 'reel'
</script>

<script setup lang="ts">
const mode = defineModel<DiceMode>({ required: true })
</script>

<template>
  <fieldset class="dice-mode" data-testid="dice-mode">
    <legend class="sr-only">Mode de dés</legend>
    <label>
      <input v-model="mode" type="radio" value="virtuel" data-testid="dice-mode-virtuel" />
      L’outil lance
    </label>
    <label>
      <input v-model="mode" type="radio" value="reel" data-testid="dice-mode-reel" />
      J’ai lancé mes dés
    </label>
  </fieldset>
</template>
