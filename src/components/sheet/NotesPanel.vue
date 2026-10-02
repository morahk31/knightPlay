<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../../stores/characters'

/** Notes libres du joueur, sauvegardées avec la fiche (et dans l'export). */
const store = useCharactersStore()
const notes = computed(() => store.active?.notes ?? '')
const count = computed(() => notes.value.length)

function onInput(event: Event): void {
  store.setNotes((event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <section v-if="store.active" class="panel notes-panel" aria-labelledby="notes-title" data-testid="notes-panel">
    <div class="panel-head">
      <h3 id="notes-title">Notes</h3>
      <span class="hint">Session, campagne, PNJ, indices… Enregistré automatiquement avec la fiche.</span>
    </div>
    <label class="sr-only" for="notes-text">Notes du personnage</label>
    <textarea
      id="notes-text"
      class="notes-text autogrow"
      rows="16"
      :value="notes"
      placeholder="Ce que votre chevalier doit retenir…"
      data-testid="notes-text"
      @input="onInput"
    ></textarea>
    <p class="hint notes-count" data-testid="notes-count">{{ count }} caractère{{ count > 1 ? 's' : '' }}</p>
  </section>
</template>
