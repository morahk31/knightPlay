<script setup lang="ts">
import { ref } from 'vue'
import { useCharactersStore } from '../stores/characters'
import { downloadCharacter, parseCharacterFile } from '../services/fileIO'

const store = useCharactersStore()
const fileInput = ref<HTMLInputElement | null>(null)
const message = ref<{ kind: 'error' | 'info'; text: string } | null>(null)

function onSelect(event: Event): void {
  store.select((event.target as HTMLSelectElement).value)
}

function onExport(): void {
  if (store.active) downloadCharacter(store.active)
}

function onDelete(): void {
  const active = store.active
  if (!active) return
  if (window.confirm(`Supprimer définitivement « ${active.nom} » ? Pensez à l’exporter avant.`)) {
    store.remove(active.id)
  }
}

async function onFileChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const result = parseCharacterFile(
    await file.text(),
    store.characters.map((c) => c.id),
  )
  if (result.ok) {
    store.addImported(result.character)
    message.value = { kind: 'info', text: `« ${result.character.nom} » importé.` }
  } else {
    message.value = { kind: 'error', text: result.error }
  }
}
</script>

<template>
  <header class="topbar">
    <h1 class="brand">Knight<span>Play</span></h1>
    <label class="sr-only" for="character-select">Personnage actif</label>
    <select
      id="character-select"
      data-testid="character-select"
      :value="store.activeId ?? ''"
      @change="onSelect"
    >
      <option v-for="c in store.characters" :key="c.id" :value="c.id">{{ c.nom }}</option>
    </select>
    <div class="actions">
      <button type="button" data-testid="btn-new" @click="store.create()">Nouveau</button>
      <button
        type="button"
        data-testid="btn-duplicate"
        :disabled="!store.active"
        @click="store.active && store.duplicate(store.active.id)"
      >
        Dupliquer
      </button>
      <button type="button" data-testid="btn-export" :disabled="!store.active" @click="onExport">
        Exporter
      </button>
      <button type="button" data-testid="btn-import" @click="fileInput?.click()">Importer</button>
      <button
        type="button"
        class="danger"
        data-testid="btn-delete"
        :disabled="!store.active"
        @click="onDelete"
      >
        Supprimer
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        hidden
        data-testid="import-input"
        @change="onFileChosen"
      />
    </div>
    <p
      v-if="message"
      class="notice"
      :class="message.kind"
      role="status"
      data-testid="topbar-message"
      @click="message = null"
    >
      {{ message.text }}
    </p>
  </header>
</template>
