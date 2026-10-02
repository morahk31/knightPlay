<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { CARAC_LABELS } from '../../rules/catalog'
import {
  ARCHETYPES,
  BLASONS,
  HAUTS_FAITS,
  MOTIVATIONS_MINEURES_EXEMPLES,
  SECTIONS,
  TOUS_AVANTAGES,
  TOUS_INCONVENIENTS,
  type Trait,
} from '../../data/creation'
import type { CaracId, Identity } from '../../rules/types'

const store = useCharactersStore()

type TextField = Exclude<keyof Identity, never>
type ListField = 'avantages' | 'inconvenients' | 'mineures'

const drafts = ref<Record<ListField, string>>({ avantages: '', inconvenients: '', mineures: '' })

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function setIdentity(field: TextField, value: string): void {
  store.mutateActive((c) => {
    c.identite[field] = value
    // Propose le vœu du blason choisi si aucun vœu n'est saisi.
    if (field === 'blason') {
      const blason = BLASONS.find((b) => b.nom.toLowerCase() === value.trim().toLowerCase())
      if (blason && c.identite.voeu.trim() === '') c.identite.voeu = blason.voeu
    }
  })
}

function setMajeure(value: string): void {
  store.mutateActive((c) => {
    c.motivations.majeure = value
  })
}

function listOf(field: ListField): string[] {
  const c = store.active
  if (!c) return []
  return field === 'mineures' ? c.motivations.mineures : c[field]
}

function addItem(field: ListField): void {
  const value = drafts.value[field].trim()
  if (!value) return
  store.mutateActive((c) => {
    const list = field === 'mineures' ? c.motivations.mineures : c[field]
    list.push(value)
  })
  drafts.value[field] = ''
}

function removeItem(field: ListField, index: number): void {
  store.mutateActive((c) => {
    const list = field === 'mineures' ? c.motivations.mineures : c[field]
    list.splice(index, 1)
  })
}

const traitsByName = new Map<string, Trait>(
  [...TOUS_AVANTAGES, ...TOUS_INCONVENIENTS].map((t) => [t.nom.toLowerCase(), t]),
)
function effetOf(nom: string): string | undefined {
  return traitsByName.get(nom.trim().toLowerCase())?.effet
}

const archetypeBonus = computed(() => {
  const nom = store.active?.identite.archetype.trim().toLowerCase()
  const archetype = ARCHETYPES.find((a) => a.nom.toLowerCase() === nom)
  if (!archetype) return ''
  const label = (b: CaracId | CaracId[]) =>
    Array.isArray(b) ? b.map((c) => CARAC_LABELS[c]).join(' ou ') : CARAC_LABELS[b]
  return `+1 ${archetype.bonus.map(label).join(', +1 ')}`
})

const hautFaitInfo = computed(() => {
  const nom = store.active?.identite.hautFait.trim().toLowerCase()
  const hf = HAUTS_FAITS.find((h) => h.nom.toLowerCase() === nom)
  return hf ? `Condition : ${hf.condition} · +1 ${hf.aspect} et 2 points` : ''
})

const sectionInfo = computed(() => {
  const nom = store.active?.identite.section.trim().toLowerCase()
  const s = SECTIONS.find((x) => x.nom.toLowerCase() === nom)
  return s ? `+1 ${s.aspect} et +1 dans ses 3 caractéristiques · ${s.modules} · ${s.inconvenient.nom}` : ''
})

const lists: { field: ListField; label: string; datalist: string }[] = [
  { field: 'avantages', label: 'Avantages', datalist: 'dl-avantages' },
  { field: 'inconvenients', label: 'Inconvénients', datalist: 'dl-inconvenients' },
  { field: 'mineures', label: 'Motivations mineures', datalist: 'dl-mineures' },
]
</script>

<template>
  <section v-if="store.active" class="panel identity" aria-labelledby="identity-title">
    <div class="identity-columns">
      <div class="identity-col">
        <h3 id="identity-title">Identité</h3>
        <div class="identity-grid">
          <label>
            Nom
            <input data-testid="identity-nom" :value="store.active.nom" @change="store.rename(store.active.id, text($event))" />
          </label>
          <label>
            Surnom
            <input data-testid="identity-surnom" :value="store.active.identite.surnom" @change="setIdentity('surnom', text($event))" />
          </label>
          <label>
            Archétype
            <input list="dl-archetypes" data-testid="identity-archetype" :value="store.active.identite.archetype" @change="setIdentity('archetype', text($event))" />
            <small v-if="archetypeBonus" class="hint">{{ archetypeBonus }}</small>
          </label>
          <label>
            Haut fait
            <input list="dl-hauts-faits" data-testid="identity-hautFait" :value="store.active.identite.hautFait" @change="setIdentity('hautFait', text($event))" />
            <small v-if="hautFaitInfo" class="hint">{{ hautFaitInfo }}</small>
          </label>
          <label>
            Blason
            <input list="dl-blasons" data-testid="identity-blason" :value="store.active.identite.blason" @change="setIdentity('blason', text($event))" />
          </label>
          <label>
            Section
            <input list="dl-sections" data-testid="identity-section" :value="store.active.identite.section" @change="setIdentity('section', text($event))" />
            <small v-if="sectionInfo" class="hint">{{ sectionInfo }}</small>
          </label>
          <label>
            Âge
            <input :value="store.active.identite.age" @change="setIdentity('age', text($event))" />
          </label>
          <label class="wide">
            Vœu du blason
            <input data-testid="identity-voeu" :value="store.active.identite.voeu" @change="setIdentity('voeu', text($event))" />
          </label>
        </div>
      </div>
      <div class="identity-col">
        <h3>Histoire</h3>
        <label class="identity-field major">
          Motivation majeure
          <input data-testid="motivation-majeure" :value="store.active.motivations.majeure" @change="setMajeure(text($event))" />
        </label>
        <label class="identity-field">
          Description et historique
          <textarea rows="7" class="autogrow" data-testid="identity-description" :value="store.active.identite.description"
            @change="setIdentity('description', text($event))"></textarea>
        </label>
      </div>
    </div>

    <div class="lists">
      <div v-for="list in lists" :key="list.field" class="list-editor" :class="list.field" :data-testid="`list-${list.field}`">
        <h4>{{ list.label }}</h4>
        <ul>
          <li v-for="(item, i) in listOf(list.field)" :key="i">
            <span class="item-name">{{ item }}</span>
            <button type="button" class="ghost" :aria-label="`Retirer ${item}`" @click="removeItem(list.field, i)">✕</button>
            <small v-if="list.field !== 'mineures' && effetOf(item)" class="hint">{{ effetOf(item) }}</small>
          </li>
          <li v-if="!listOf(list.field).length" class="empty muted">Aucun.</li>
        </ul>
        <form class="add-row" @submit.prevent="addItem(list.field)">
          <input v-model="drafts[list.field]" :list="list.datalist" :data-testid="`list-${list.field}-input`" :placeholder="`Ajouter…`" />
          <button type="submit" :data-testid="`list-${list.field}-add`">Ajouter</button>
        </form>
      </div>
    </div>

    <datalist id="dl-archetypes"><option v-for="a in ARCHETYPES" :key="a.nom" :value="a.nom" /></datalist>
    <datalist id="dl-hauts-faits"><option v-for="h in HAUTS_FAITS" :key="h.nom" :value="h.nom" /></datalist>
    <datalist id="dl-blasons"><option v-for="b in BLASONS" :key="b.nom" :value="b.nom" /></datalist>
    <datalist id="dl-sections"><option v-for="s in SECTIONS" :key="s.nom" :value="s.nom" /></datalist>
    <datalist id="dl-mineures"><option v-for="m in MOTIVATIONS_MINEURES_EXEMPLES" :key="m" :value="m" /></datalist>
    <datalist id="dl-avantages"><option v-for="t in TOUS_AVANTAGES" :key="t.nom" :value="t.nom" /></datalist>
    <datalist id="dl-inconvenients"><option v-for="t in TOUS_INCONVENIENTS" :key="t.nom" :value="t.nom" /></datalist>
  </section>
</template>
