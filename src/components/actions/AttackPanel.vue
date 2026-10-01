<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCharactersStore } from '../../stores/characters'
import { useLogStore } from '../../stores/log'
import { ASPECTS, CARAC_LABELS } from '../../rules/catalog'
import { countSuccesses, parseFaces, rollD6, type Rng } from '../../rules/dice'
import { hasArmor } from '../../rules/armor'
import { effectLabel, effectDescription, hasEffect } from '../../rules/effects'
import { STYLES, combatDefenses, findStyle, styleTransfersDice } from '../../rules/styles'
import { describeResult, resolveFromCount, resolveFromFaces, type TestResult } from '../../rules/test'
import {
  DEFAULT_TARGET,
  describeParts,
  hitOf,
  planAttack,
  planDamage,
  resolveDamage,
  sumDice,
  type AttackHit,
  type AttackInput,
  type DamageResult,
  type TargetInput,
} from '../../rules/attack'
import { formatDice, unarmedProfile } from '../../data/weapons'
import type { CaracId, StyleId, WeaponProfile } from '../../rules/types'
import DiceModeToggle, { type DiceMode } from './DiceModeToggle.vue'
import RollResult from './RollResult.vue'

const props = defineProps<{ rng?: Rng }>()

const store = useCharactersStore()
const log = useLogStore()
const c = computed(() => store.active)

const UNARMED = 'mains-nues'
const weaponUid = ref<string>(UNARMED)
const profileIndex = ref(0)
const base = ref<CaracId>('combat')
const combo = ref<CaracId | ''>('')
const extra = ref<CaracId | ''>('')
const modDes = ref(0)
const modReussites = ref(0)

const target = ref<TargetInput>({ ...DEFAULT_TARGET })
const cibleType = ref<'autre' | 'humain' | 'anatheme'>('autre')
const surprise = ref(false)
const degatsMax = ref(false)
const heroique = ref(false)
const transfert = ref(0)
const transfertVers = ref<'degats' | 'violence'>('degats')

const mode = ref<DiceMode>('virtuel')
const saisieReussites = ref<number | ''>('')
const saisieFaces = ref('')
const saisieExploit = ref<number | ''>('')
const saisieDegats = ref<number | ''>('')
const saisieViolence = ref<number | ''>('')
const saisieAkimbo = ref<number | ''>('')

const toucher = ref<TestResult | null>(null)
const hit = ref<AttackHit | null>(null)
const damage = ref<DamageResult | null>(null)
const erreur = ref<string | null>(null)

const weapon = computed(() => c.value?.armes.find((w) => w.uid === weaponUid.value) ?? null)
const profiles = computed<WeaponProfile[]>(() =>
  weapon.value ? weapon.value.profils : [unarmedProfile(!!c.value && hasArmor(c.value))],
)
const profile = computed<WeaponProfile>(() => profiles.value[profileIndex.value] ?? profiles.value[0]!)
const weaponName = computed(() => (weapon.value ? weapon.value.nom : 'Mains nues'))
const ameliorations = computed(() => weapon.value?.ameliorations ?? [])
const style = computed<StyleId>(() => c.value?.combat.style ?? 'standard')

watch([weaponUid, profileIndex], () => {
  if (profileIndex.value >= profiles.value.length) profileIndex.value = 0
  base.value = profile.value.type === 'contact' ? 'combat' : 'tir'
  if (combo.value === base.value) combo.value = ''
  reset()
})

watch(cibleType, (t) => {
  target.value.humain = t === 'humain'
  target.value.anatheme = t === 'anatheme'
})

function reset(): void {
  toucher.value = null
  hit.value = null
  damage.value = null
  erreur.value = null
}

const options = computed(() => ({
  style: style.value,
  surprise: surprise.value,
  degatsMax: degatsMax.value,
  heroique: heroique.value,
  transfert: transfert.value || 0,
  transfertVers: transfertVers.value,
}))

const input = computed<AttackInput>(() => ({
  base: base.value,
  combo: combo.value || null,
  extra: extra.value || null,
  modDes: modDes.value || 0,
  modReussites: modReussites.value || 0,
  avecOd: true,
  desSacrifies: 0,
  profile: profile.value,
  ameliorations: ameliorations.value,
  target: target.value,
  options: options.value,
}))

const plan = computed(() => (c.value ? planAttack(c.value, input.value, store.rules) : null))
const defenses = computed(() => (c.value ? combatDefenses(c.value, store.rules, plan.value?.profile.effets ?? []) : null))
const oppositionLabel = computed(() => (profile.value.type === 'contact' ? 'Défense' : 'Réaction'))
const chanceText = computed(() => (plan.value?.test.chance == null ? null : `${Math.round(plan.value.test.chance * 100)} %`))
/** La 3ᵉ caractéristique est gratuite en style précis. */
const extraCost = computed(() => (extra.value && style.value !== 'precis' ? 1 : 0))

/** Aperçu des dégâts avant le jet (sans excédent connu). */
const damagePreview = computed(() =>
  c.value
    ? planDamage(c.value, profile.value, damageContext(null, null), store.rules)
    : null,
)

function damageContext(reussites: number | null, excedent: number | null) {
  return { reussites, excedent, target: target.value, options: options.value, ameliorations: ameliorations.value }
}

const damagePlan = computed(() =>
  c.value && hit.value && hit.value.touche !== false
    ? planDamage(c.value, profile.value, damageContext(toucher.value?.total ?? null, hit.value.excedent), store.rules)
    : null,
)

const parsedFaces = computed(() => (saisieFaces.value.trim() ? parseFaces(saisieFaces.value) : null))
const exploitAttendu = computed(() => {
  const p = plan.value?.test
  if (!p || p.des === 0 || !store.rules.systeme.exploitRelance) return false
  if (parsedFaces.value) return parsedFaces.value.length === p.des && parsedFaces.value.every((f) => f % 2 === 0)
  return saisieReussites.value !== '' && Number(saisieReussites.value) >= p.des
})

function setStyle(event: Event): void {
  store.setStyle((event.target as HTMLSelectElement).value as StyleId)
  transfert.value = 0
}

function setOpposition(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  target.value.opposition = raw === '' ? null : Math.max(0, Math.trunc(Number(raw)))
}

function setChair(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  target.value.chair = raw === '' ? null : Math.max(0, Math.trunc(Number(raw)))
}

function spendHeroism(points: number): boolean {
  if (!points) return true
  if ((c.value?.jauges.heroisme.actuel ?? 0) < points) {
    erreur.value = 'Pas assez de points d’héroïsme.'
    return false
  }
  store.adjustGauge('heroisme', -points)
  return true
}

/** 1ʳᵉ action : le jet pour toucher. */
function attaquer(): void {
  reset()
  const p = plan.value
  if (!p || !c.value) return
  if (p.test.erreurs.length) {
    erreur.value = p.test.erreurs.join(' ')
    return
  }
  let r: TestResult
  if (mode.value === 'virtuel') {
    const faces = rollD6(p.test.des, props.rng)
    const toutPair = p.test.des > 0 && faces.every((f) => f % 2 === 0)
    const relance = toutPair && store.rules.systeme.exploitRelance ? rollD6(p.test.des, props.rng) : null
    r = resolveFromFaces(p.test, faces, relance, store.rules)
  } else {
    let reussites: number
    let faces: number[] | null = null
    if (saisieFaces.value.trim()) {
      faces = parsedFaces.value
      if (!faces || faces.length !== p.test.des) {
        erreur.value = `Saisissez exactement ${p.test.des} faces entre 1 et 6.`
        return
      }
      reussites = countSuccesses(faces)
    } else {
      if (p.test.des > 0 && saisieReussites.value === '') {
        erreur.value = 'Indiquez le nombre de réussites (dés pairs) obtenues, ou les faces.'
        return
      }
      reussites = Number(saisieReussites.value) || 0
    }
    if (exploitAttendu.value && saisieExploit.value === '') {
      erreur.value = 'Exploit ! Indiquez les réussites obtenues sur la relance.'
      return
    }
    r = { ...resolveFromCount(p.test, reussites, Number(saisieExploit.value) || 0, store.rules), faces }
  }
  if (!spendHeroism(extraCost.value)) return
  toucher.value = r
  hit.value = hitOf(r)
  const verdict = hit.value.touche === null ? `${r.total} réussites` : hit.value.touche ? 'touché' : 'raté'
  log.add({
    kind: 'test',
    title: `Attaque : ${weaponName.value}`,
    detail: `${describeResult(r)} → ${verdict}`,
    outcome: r.critique ? 'critique' : hit.value.touche === false ? 'echec' : hit.value.touche ? 'reussite' : 'info',
  })
  saisieReussites.value = ''
  saisieFaces.value = ''
  saisieExploit.value = ''
}

/** 2ᵉ action : dégâts et violence (après un toucher, ou seuls). */
function degats(seuls = false): void {
  erreur.value = null
  if (!c.value) return
  if (seuls) {
    toucher.value = null
    hit.value = { touche: null, excedent: null }
  }
  const dp = damagePlan.value
  if (!dp) return
  if (degatsMax.value && !spendHeroism(1)) return
  const nD = sumDice(dp.degats)
  const nV = sumDice(dp.violence)
  let result: DamageResult
  if (mode.value === 'virtuel') {
    const akimbo = dp.akimboViolence ? rollD6(dp.akimboViolence.des, props.rng).reduce((a, b) => a + b, 0) : null
    result = resolveDamage(dp, rollD6(nD, props.rng), rollD6(nV, props.rng), akimbo, store.rules)
  } else {
    if ((nD && !dp.maxDegats && saisieDegats.value === '') || (nV && saisieViolence.value === '')) {
      erreur.value = 'Indiquez la somme des dés de dégâts et de violence.'
      return
    }
    const akimbo = dp.akimboViolence ? Number(saisieAkimbo.value) || 0 : null
    result = resolveDamage(dp, Number(saisieDegats.value) || 0, Number(saisieViolence.value) || 0, akimbo, store.rules)
  }
  damage.value = result
  log.add({
    kind: 'info',
    title: `Dégâts : ${weaponName.value}`,
    detail: `${result.degats} dégâts (${describeParts(dp.degats, result.sommeDegats)}) · ${result.violence} violence (${describeParts(dp.violence, result.sommeViolence)})${dp.notes.length ? ' · ' + dp.notes.join(' ') : ''}`,
    outcome: 'info',
  })
  saisieDegats.value = ''
  saisieViolence.value = ''
  saisieAkimbo.value = ''
}
</script>

<template>
  <section v-if="c && plan" class="card attack-panel" aria-labelledby="attack-title" data-testid="attack-panel">
    <h3 id="attack-title">Attaque</h3>

    <div class="form-grid">
      <label class="wide">
        Arme
        <select v-model="weaponUid" data-testid="attack-weapon">
          <option :value="UNARMED">Mains nues</option>
          <option v-for="w in c.armes" :key="w.uid" :value="w.uid">{{ w.nom }}</option>
        </select>
      </label>
      <label v-if="profiles.length > 1" class="wide">
        Profil
        <select v-model.number="profileIndex" data-testid="attack-profile">
          <option v-for="(pr, i) in profiles" :key="i" :value="i">{{ pr.nom }}</option>
        </select>
      </label>
      <p class="wide hint profile-line" data-testid="attack-profile-line">
        {{ formatDice(plan.profile.degats) }} / {{ formatDice(plan.profile.violence) }} · {{ plan.profile.portee }}
        <span v-for="(e, k) in plan.profile.effets" :key="k" class="chip" :title="effectDescription(e)">{{ effectLabel(e) }}</span>
      </p>
      <label class="wide">
        Style
        <select :value="style" data-testid="attack-style" @change="setStyle">
          <option v-for="s in STYLES" :key="s.id" :value="s.id">{{ s.nom }}</option>
        </select>
      </label>
      <p class="wide hint">{{ findStyle(style).description }}<template v-if="findStyle(style).requis"> ({{ findStyle(style).requis }})</template></p>
      <template v-if="styleTransfersDice(style)">
        <label>
          {{ style === 'puissant' ? 'Dés échangés' : 'Tours sur la cible' }}
          <input v-model.number="transfert" type="number" min="0" max="6" data-testid="attack-transfert" />
        </label>
        <label>
          Vers
          <select v-model="transfertVers"><option value="degats">dégâts</option><option value="violence">violence</option></select>
        </label>
      </template>
      <label>
        Base
        <select v-model="base" data-testid="attack-base">
          <optgroup v-for="a in ASPECTS" :key="a.id" :label="a.nom">
            <option v-for="k in a.caracs" :key="k" :value="k">{{ CARAC_LABELS[k] }} ({{ c.caracs[k].val }})</option>
          </optgroup>
        </select>
      </label>
      <label>
        Combo
        <select v-model="combo" data-testid="attack-combo">
          <option value="">— aucune —</option>
          <optgroup v-for="a in ASPECTS" :key="a.id" :label="a.nom">
            <option v-for="k in a.caracs" :key="k" :value="k" :disabled="k === base">{{ CARAC_LABELS[k] }} ({{ c.caracs[k].val }})</option>
          </optgroup>
        </select>
      </label>
      <label class="wide">
        3ᵉ caractéristique {{ style === 'precis' ? '(style précis)' : '(1 point d’héroïsme)' }}
        <select v-model="extra" data-testid="attack-extra">
          <option value="">— aucune —</option>
          <optgroup v-for="a in ASPECTS" :key="a.id" :label="a.nom">
            <option v-for="k in a.caracs" :key="k" :value="k" :disabled="k === base || k === combo">{{ CARAC_LABELS[k] }} ({{ c.caracs[k].val }})</option>
          </optgroup>
        </select>
      </label>
      <label>Dés ± <input v-model.number="modDes" type="number" data-testid="attack-mod-des" /></label>
      <label>Réussites ± <input v-model.number="modReussites" type="number" /></label>
    </div>

    <fieldset class="target" data-testid="attack-target">
      <legend>Cible</legend>
      <div class="form-grid">
        <label>
          {{ oppositionLabel }}
          <input type="number" min="0" placeholder="inconnue" :value="target.opposition ?? ''" data-testid="attack-opposition" @change="setOpposition" />
        </label>
        <label>
          Type
          <select v-model="cibleType" data-testid="attack-target-type">
            <option value="autre">Autre</option>
            <option value="humain">Humain</option>
            <option value="anatheme">Anathème</option>
          </select>
        </label>
        <label>
          Chair
          <input type="number" min="0" placeholder="?" :value="target.chair ?? ''" data-testid="attack-chair" @change="setChair" />
        </label>
        <label>Barrage subi <input v-model.number="target.barrage" type="number" min="0" data-testid="attack-barrage" /></label>
        <label v-if="target.anatheme">Lumière subie <input v-model.number="target.lumiere" type="number" min="0" data-testid="attack-lumiere" /></label>
      </div>
      <div class="checks-grid">
        <label><input v-model="target.pointFaible" type="checkbox" data-testid="attack-point-faible" /> Point faible</label>
        <label><input v-model="target.bande" type="checkbox" data-testid="attack-bande" /> Bande</label>
        <label><input v-model="target.hostile" type="checkbox" /> Hostile</label>
        <label><input v-model="target.invisible" type="checkbox" /> Non repérée</label>
        <label v-if="plan.profile.type === 'distance'"><input v-model="target.designee" type="checkbox" /> Désignée</label>
        <label><input v-model="surprise" type="checkbox" data-testid="attack-surprise" /> Attaque surprise / Ghost</label>
        <label v-if="hasEffect(plan.profile.effets, 'destructeur')"><input v-model="target.touchePa" type="checkbox" /> PA touchés</label>
        <label v-if="hasEffect(plan.profile.effets, 'meurtrier')"><input v-model="target.touchePs" type="checkbox" /> PS touchés</label>
        <label><input v-model="degatsMax" type="checkbox" /> Dégâts max (1 héroïsme)</label>
        <label><input v-model="heroique" type="checkbox" /> Mode héroïque</label>
      </div>
    </fieldset>

    <p class="preview" data-testid="attack-preview">
      <strong>{{ plan.test.des }}</strong> dé{{ plan.test.des > 1 ? 's' : '' }} + <strong>{{ plan.test.auto }}</strong> auto
      <template v-if="plan.opposition !== null"> contre <strong data-testid="attack-opposition-effective">{{ plan.opposition }}</strong></template>
      <span v-if="chanceText" data-testid="attack-chance"> · {{ chanceText }}</span>
      <span v-if="plan.test.malusEspoir" class="malus"> · désespoir −{{ plan.test.malusEspoir }}</span>
    </p>
    <p v-if="damagePreview" class="hint" data-testid="attack-damage-preview">
      Dégâts {{ describeParts(damagePreview.degats) }} · violence {{ describeParts(damagePreview.violence) }}
    </p>
    <p v-if="defenses" class="hint">Vous : défense {{ defenses.defense }}, réaction {{ defenses.reaction }} (style compris)</p>
    <p v-for="n in plan.notes" :key="n" class="hint">{{ n }}</p>

    <DiceModeToggle v-model="mode" />
    <div v-if="mode === 'reel' && !hit" class="manual" data-testid="attack-manual">
      <label>Réussites aux dés <input v-model.number="saisieReussites" type="number" min="0" data-testid="attack-manual-reussites" /></label>
      <label>ou faces <input v-model="saisieFaces" placeholder="ex. 2 4 5 6" /></label>
      <label v-if="exploitAttendu" class="wide">Exploit ! Réussites de la relance <input v-model.number="saisieExploit" type="number" min="0" /></label>
    </div>

    <div class="attack-buttons">
      <button type="button" class="primary" data-testid="attack-roll" @click="attaquer">{{ mode === 'virtuel' ? 'Attaquer' : 'Valider le toucher' }}</button>
      <button type="button" data-testid="attack-damage-only" @click="degats(true)">Dégâts seuls</button>
    </div>
    <p v-if="erreur" class="error-text" role="alert" data-testid="attack-error">{{ erreur }}</p>

    <RollResult v-if="toucher" :result="toucher" />

    <div v-if="damagePlan && !damage" class="damage-step" data-testid="attack-damage-step">
      <p class="hint">
        À lancer : <strong>{{ sumDice(damagePlan.degats) }}D6</strong> de dégâts<template v-if="damagePlan.maxDegats"> (au maximum)</template>,
        <strong>{{ sumDice(damagePlan.violence) }}D6</strong> de violence<template v-if="damagePlan.akimboViolence"> + {{ damagePlan.akimboViolence.des }}D6 (2ᵉ arme, moitié)</template>
      </p>
      <div v-if="mode === 'reel'" class="manual">
        <label v-if="!damagePlan.maxDegats">Somme dégâts <input v-model.number="saisieDegats" type="number" min="0" data-testid="attack-sum-degats" /></label>
        <label>Somme violence <input v-model.number="saisieViolence" type="number" min="0" data-testid="attack-sum-violence" /></label>
        <label v-if="damagePlan.akimboViolence">Violence 2ᵉ arme <input v-model.number="saisieAkimbo" type="number" min="0" /></label>
      </div>
      <button type="button" class="primary" data-testid="attack-damage" @click="degats()">Dégâts</button>
    </div>

    <div v-if="damage" class="roll-result reussite damage-result" data-testid="attack-damage-result">
      <div v-if="damage.facesDegats?.length" class="faces"><span v-for="(f, i) in damage.facesDegats" :key="i" class="die">{{ f }}</span></div>
      <p class="sum">Dégâts : {{ describeParts(damage.plan.degats, damage.sommeDegats) }} = <strong data-testid="attack-total-degats">{{ damage.degats }}</strong></p>
      <p class="sum">Violence : {{ describeParts(damage.plan.violence, damage.sommeViolence) }}<template v-if="damage.violenceAkimbo"> + {{ damage.violenceAkimbo }} (akimbo)</template>
        = <strong data-testid="attack-total-violence">{{ damage.violence }}</strong></p>
      <p v-for="n in damage.plan.notes" :key="n" class="hint">{{ n }}</p>
    </div>
  </section>
</template>
