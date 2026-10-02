<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRulesStore } from '../stores/rules'
import { builtIn, type CatalogKind } from '../data/catalog'
import { formatDice, parseDice } from '../data/weapons'
import { CARAC_IDS, CARAC_LABELS } from '../rules/catalog'
import { SLOT_LABELS, SLOT_ZONES } from '../rules/armor'
import { formatEffects, parseEffects, type EffectDef } from '../rules/effects'
import type { ArmorDef, CaracId, Disponibilite, ModuleDef, Portee, Slots, WeaponDef } from '../rules/types'

const rules = useRulesStore()

const KINDS: { id: CatalogKind; label: string }[] = [
  { id: 'armes', label: 'Armes' },
  { id: 'modules', label: 'Modules' },
  { id: 'armures', label: 'Armures' },
  { id: 'effets', label: 'Effets' },
]
const DISPOS: { id: Disponibilite; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'avance', label: 'Avancé' },
  { id: 'rare', label: 'Rare' },
  { id: 'prestige', label: 'Prestige' },
]
const PORTEES: Portee[] = ['contact', 'courte', 'moyenne', 'longue', 'lointaine']

const kind = ref<CatalogKind>('armes')
const builtInId = ref('')
const erreur = ref<string | null>(null)
const saved = ref<string | null>(null)

const customs = computed(() => rules.catalogues[kind.value] as { id: string; nom?: string; label?: string }[])
const builtIns = computed(() => builtIn(kind.value))
const hidden = computed(() => builtIns.value.filter((x) => rules.catalogues.masques.includes(x.id)))
const nameOf = (x: { nom?: string; label?: string; id: string }) => x.nom ?? x.label ?? x.id

// --- Brouillons (copies modifiables) ---
interface ProfileDraft { nom: string; type: 'contact' | 'distance'; degats: string; violence: string; portee: Portee; effets: string; energie: string }
interface LevelDraft { pg: number; dispo: Disponibilite; effet: string }

const draftKind = ref<CatalogKind | null>(null)
const draftId = ref('')
const nom = ref('')
const dispo = ref<Disponibilite>('standard')
const pg = ref(0)
const source = ref('Règle maison')
const notes = ref('')
const profils = ref<ProfileDraft[]>([])
// modules
const categorie = ref('Règle maison')
const slots = ref<Slots>({ tete: 0, brasG: 0, brasD: 0, torse: 0, jambeG: 0, jambeD: 0 })
const energie = ref<number | ''>('')
const activation = ref('')
const duree = ref('')
const effet = ref('')
const niveaux = ref<LevelDraft[]>([])
// armures
const generation = ref(2)
const pa = ref(0)
const pe = ref(0)
const cdf = ref(0)
const od = ref('')
let armorBase: ArmorDef | null = null
let moduleBase: ModuleDef | null = null
// effets
const description = ref('')
const avecX = ref(false)

function emptyProfile(): ProfileDraft {
  return { nom: 'Contact', type: 'contact', degats: '2D6', violence: '1D6', portee: 'contact', effets: '', energie: '' }
}

function slug(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function odText(o: Partial<Record<CaracId, number>>): string {
  return Object.entries(o).map(([k, v]) => `${CARAC_LABELS[k as CaracId]} ${v}`).join(', ')
}

function parseOd(text: string): Partial<Record<CaracId, number>> | null {
  const out: Partial<Record<CaracId, number>> = {}
  for (const part of text.split(',').map((p) => p.trim()).filter(Boolean)) {
    const m = /^(.*?)\s+(\d+)$/.exec(part)
    const carac = m && CARAC_IDS.find((c) => slug(CARAC_LABELS[c]) === slug(m[1]!))
    if (!m || !carac) return null
    out[carac] = Number(m[2])
  }
  return out
}

/** Ouvre le formulaire : entrée existante (copie) ou nouvelle. */
function edit(k: CatalogKind, entry: unknown | null): void {
  draftKind.value = k
  erreur.value = null
  saved.value = null
  const e = (entry ?? {}) as Record<string, unknown>
  draftId.value = (e.id as string) ?? ''
  nom.value = (e.nom as string) ?? (e.label as string) ?? ''
  source.value = (e.source as string) ?? 'Règle maison'
  notes.value = (e.notes as string) ?? ''
  if (k === 'armes') {
    const w = entry as WeaponDef | null
    dispo.value = w?.dispo ?? 'standard'
    pg.value = w?.pg ?? 0
    profils.value = w
      ? w.profils.map((p) => ({ nom: p.nom, type: p.type, degats: formatDice(p.degats), violence: formatDice(p.violence), portee: p.portee, effets: formatEffects(p.effets), energie: p.energie ?? '' }))
      : [emptyProfile()]
  } else if (k === 'modules') {
    const m = entry as ModuleDef | null
    moduleBase = m
    categorie.value = m?.categorie ?? 'Règle maison'
    slots.value = { tete: 0, brasG: 0, brasD: 0, torse: 0, jambeG: 0, jambeD: 0, ...(m?.slots ?? {}) }
    energie.value = m?.energie ?? ''
    activation.value = m?.activation ?? ''
    duree.value = m?.duree ?? ''
    effet.value = m?.effet ?? ''
    niveaux.value = m ? m.niveaux.map((l) => ({ pg: l.pg, dispo: l.dispo, effet: l.effet })) : [{ pg: 10, dispo: 'standard', effet: '' }]
  } else if (k === 'armures') {
    const a = entry as ArmorDef | null
    armorBase = a
    generation.value = a?.generation ?? 2
    pa.value = a?.pa ?? 50
    pe.value = a?.pe ?? 50
    cdf.value = a?.cdf ?? 10
    slots.value = { ...(a?.slots ?? { tete: 5, brasG: 5, brasD: 5, torse: 8, jambeG: 5, jambeD: 5 }) }
    od.value = a ? odText(a.od) : ''
  } else {
    const ef = entry as EffectDef | null
    description.value = ef?.description ?? ''
    avecX.value = ef?.x ?? false
  }
}

function copyBuiltIn(): void {
  const entry = (builtIns.value as { id: string }[]).find((x) => x.id === builtInId.value)
  if (entry) edit(kind.value, JSON.parse(JSON.stringify(entry)))
}

function cancel(): void {
  draftKind.value = null
}

const nonNeg = (n: number) => Number.isInteger(n) && n >= 0

function save(): void {
  erreur.value = null
  const k = draftKind.value
  if (!k) return
  const name = nom.value.trim()
  if (!name) {
    erreur.value = 'Le nom est obligatoire.'
    return
  }
  const id = draftId.value || `perso-${slug(name)}-${Math.random().toString(36).slice(2, 6)}`
  if (k === 'armes') {
    if (!nonNeg(pg.value)) return void (erreur.value = 'Le coût en PG doit être un entier positif ou nul.')
    if (!profils.value.length) return void (erreur.value = 'Il faut au moins un profil.')
    const weapon: WeaponDef = {
      id, nom: name, dispo: dispo.value, pg: pg.value, source: source.value,
      categorie: profils.value.every((p) => p.type === 'distance') ? 'distance' : 'contact',
      profils: profils.value.map((p) => ({
        nom: p.nom || 'Profil', type: p.type, degats: parseDice(p.degats), violence: parseDice(p.violence), portee: p.portee,
        effets: parseEffects(p.effets, rules.catalogs.effets), ...(p.energie ? { energie: p.energie } : {}),
      })),
      ...(notes.value ? { notes: notes.value } : {}),
    }
    rules.upsertCustom('armes', weapon)
  } else if (k === 'modules') {
    if (!niveaux.value.length || !niveaux.value.every((l) => nonNeg(l.pg))) return void (erreur.value = 'Chaque niveau doit avoir un coût en PG positif ou nul.')
    if (!SLOT_ZONES.every((z) => nonNeg(slots.value[z]))) return void (erreur.value = 'Les slots doivent être des entiers positifs ou nuls.')
    const s: Partial<Slots> = {}
    for (const z of SLOT_ZONES) if (slots.value[z]) s[z] = slots.value[z]
    const mod: ModuleDef = {
      ...(moduleBase && moduleBase.id === id ? moduleBase : {}),
      id, nom: name, categorie: categorie.value || 'Règle maison', slots: s, activation: activation.value, duree: duree.value,
      energie: energie.value === '' ? null : Math.max(0, Math.trunc(Number(energie.value))), effet: effet.value,
      niveaux: niveaux.value.map((l, i) => ({ niveau: i + 1, pg: l.pg, dispo: l.dispo, effet: l.effet })), source: source.value,
    }
    rules.upsertCustom('modules', mod)
  } else if (k === 'armures') {
    if (![pa.value, pe.value, cdf.value].every(nonNeg) || !SLOT_ZONES.every((z) => nonNeg(slots.value[z]))) {
      return void (erreur.value = 'PA, PE, CdF et slots doivent être des entiers positifs ou nuls.')
    }
    const ods = parseOd(od.value)
    if (!ods) return void (erreur.value = 'OD : écrivez par exemple « Tir 1, Discrétion 1 ».')
    const armor: ArmorDef = {
      capacites: [], evolutions: [], ...(armorBase && armorBase.id === id ? armorBase : {}),
      id, nom: name, generation: generation.value, pa: pa.value, pe: pe.value, cdf: cdf.value, od: ods, slots: { ...slots.value },
      aVerifier: false, source: source.value, ...(notes.value ? { notes: notes.value } : {}),
    }
    rules.upsertCustom('armures', armor)
  } else {
    if (!description.value.trim()) return void (erreur.value = 'La description est obligatoire.')
    rules.upsertCustom('effets', { id, label: name, description: description.value.trim(), ...(avecX.value ? { x: true } : {}) })
  }
  saved.value = `« ${name} » enregistré.`
  draftKind.value = null
}
</script>

<template>
  <div class="catalog-editor" data-testid="catalog-editor">
    <div class="tabs" role="tablist">
      <button v-for="k in KINDS" :key="k.id" type="button" role="tab" class="tab" :class="{ active: kind === k.id }" :aria-selected="kind === k.id"
        :data-testid="`catalog-kind-${k.id}`" @click="kind = k.id; draftKind = null; builtInId = ''">{{ k.label }}</button>
    </div>
    <p class="hint">
      Les entrées personnalisées s’ajoutent aux catalogues ; une copie corrigée remplace l’entrée fournie. Les armes et modules déjà
      sur une fiche gardent leurs valeurs : retirez-les et rajoutez-les pour appliquer une correction.
    </p>

    <div class="add-module">
      <button type="button" class="primary" data-testid="catalog-new" @click="edit(kind, null)">Nouvelle entrée</button>
      <select v-model="builtInId" data-testid="catalog-builtin" aria-label="Entrée fournie">
        <option value="">— Entrée fournie —</option>
        <option v-for="x in builtIns" :key="x.id" :value="x.id">{{ nameOf(x) }}</option>
      </select>
      <button type="button" :disabled="!builtInId" data-testid="catalog-copy" @click="copyBuiltIn">Copier pour corriger</button>
      <button type="button" :disabled="!builtInId" data-testid="catalog-hide" @click="rules.toggleHidden(builtInId)">
        {{ rules.catalogues.masques.includes(builtInId) ? 'Afficher' : 'Masquer' }}
      </button>
    </div>
    <p v-if="saved" class="notice info" role="status" data-testid="catalog-saved">{{ saved }}</p>

    <form v-if="draftKind" class="panel catalog-form" data-testid="catalog-form" @submit.prevent="save">
      <div class="form-grid">
        <label class="wide">{{ draftKind === 'effets' ? 'Libellé' : 'Nom' }} <input v-model="nom" data-testid="catalog-nom" /></label>

        <template v-if="draftKind === 'armes'">
          <label>Disponibilité <select v-model="dispo"><option v-for="d in DISPOS" :key="d.id" :value="d.id">{{ d.label }}</option></select></label>
          <label>PG <input v-model.number="pg" type="number" min="0" data-testid="catalog-pg" /></label>
        </template>

        <template v-if="draftKind === 'modules'">
          <label>Catégorie <input v-model="categorie" /></label>
          <label>PE <input v-model="energie" type="number" min="0" placeholder="—" /></label>
          <label>Activation <input v-model="activation" /></label>
          <label>Durée <input v-model="duree" /></label>
          <label class="wide">Effet <input v-model="effet" /></label>
        </template>

        <template v-if="draftKind === 'armures'">
          <label>Génération <input v-model.number="generation" type="number" min="1" max="9" /></label>
          <label>PA <input v-model.number="pa" type="number" min="0" data-testid="catalog-pa" /></label>
          <label>PE <input v-model.number="pe" type="number" min="0" /></label>
          <label>CdF <input v-model.number="cdf" type="number" min="0" /></label>
          <label class="wide">OD de base <input v-model="od" placeholder="Tir 1, Discrétion 1" /></label>
        </template>

        <template v-if="draftKind === 'effets'">
          <label class="wide">Description <input v-model="description" data-testid="catalog-description" /></label>
          <label class="check"><input v-model="avecX" type="checkbox" /> Prend une valeur X</label>
        </template>

        <label v-if="draftKind !== 'effets'" class="wide">Source <input v-model="source" /></label>
      </div>

      <div v-if="draftKind === 'modules' || draftKind === 'armures'" class="slots-inline">
        <label v-for="z in SLOT_ZONES" :key="z">{{ SLOT_LABELS[z] }} <input v-model.number="slots[z]" type="number" min="0" /></label>
      </div>

      <template v-if="draftKind === 'armes'">
        <div v-for="(p, i) in profils" :key="i" class="weapon-profile">
          <input v-model="p.nom" class="wp-name" aria-label="Profil" />
          <select v-model="p.type" aria-label="Type"><option value="contact">Contact</option><option value="distance">Distance</option></select>
          <label class="inline">Dégâts <input v-model="p.degats" class="wp-dice" :data-testid="`catalog-degats-${i}`" /></label>
          <label class="inline">Violence <input v-model="p.violence" class="wp-dice" /></label>
          <select v-model="p.portee" aria-label="Portée"><option v-for="po in PORTEES" :key="po" :value="po">{{ po }}</option></select>
          <input v-model="p.effets" class="wp-effects" placeholder="effets" aria-label="Effets" />
          <button type="button" class="ghost" aria-label="Retirer le profil" @click="profils.splice(i, 1)">✕</button>
        </div>
        <button type="button" class="small-inline" @click="profils.push(emptyProfile())">+ Profil</button>
      </template>

      <template v-if="draftKind === 'modules'">
        <div v-for="(l, i) in niveaux" :key="i" class="weapon-profile">
          <span class="muted">Niv {{ i + 1 }}</span>
          <label class="inline">PG <input v-model.number="l.pg" type="number" min="0" class="wp-dice" /></label>
          <select v-model="l.dispo"><option v-for="d in DISPOS" :key="d.id" :value="d.id">{{ d.label }}</option></select>
          <input v-model="l.effet" class="wp-effects" placeholder="Effet du niveau" />
          <button type="button" class="ghost" aria-label="Retirer le niveau" @click="niveaux.splice(i, 1)">✕</button>
        </div>
        <button type="button" class="small-inline" @click="niveaux.push({ pg: 10, dispo: 'standard', effet: '' })">+ Niveau</button>
      </template>

      <label v-if="draftKind === 'armes' || draftKind === 'armures'" class="wide notes-field">Notes <input v-model="notes" /></label>
      <p v-if="draftKind === 'armures'" class="hint">Les capacités et évolutions d’une armure copiée sont conservées.</p>

      <p v-if="erreur" class="error-text" role="alert" data-testid="catalog-error">{{ erreur }}</p>
      <div class="attack-buttons">
        <button type="submit" class="primary" data-testid="catalog-save">Enregistrer</button>
        <button type="button" @click="cancel">Annuler</button>
      </div>
    </form>

    <h4>Entrées personnalisées</h4>
    <ul class="module-list" data-testid="catalog-customs">
      <li v-for="x in customs" :key="x.id" class="module-head">
        <span class="module-name">{{ nameOf(x) }}</span>
        <span class="muted small">{{ builtIns.some((b) => b.id === x.id) ? 'correction' : 'ajout' }}</span>
        <button type="button" class="small-inline" @click="edit(kind, JSON.parse(JSON.stringify(x)))">Modifier</button>
        <button type="button" class="ghost" :aria-label="`Supprimer ${nameOf(x)}`" @click="rules.removeCustom(kind, x.id)">✕</button>
      </li>
      <li v-if="!customs.length" class="muted">Aucune.</li>
    </ul>
    <template v-if="hidden.length">
      <h4>Masqués</h4>
      <ul class="module-list">
        <li v-for="x in hidden" :key="x.id" class="module-head">
          <span class="module-name">{{ nameOf(x) }}</span>
          <button type="button" class="small-inline" @click="rules.toggleHidden(x.id)">Afficher</button>
        </li>
      </ul>
    </template>
  </div>
</template>
