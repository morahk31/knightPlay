import { effectiveOd } from './armor'
import { effectValue, hasEffect, parseEffects } from './effects'
import { styleAttackDice, styleTransfersDice } from './styles'
import { planTest, type TestPlan, type TestResult } from './test'
import { findUpgrade } from '../data/weapons'
import type { CaracId, Character, DiceExpr, RulesConfig, StyleId, WeaponProfile } from './types'

/** Attaque : toucher, dégâts et violence (fiches 03 et 08, FAQ fiche 11). */

export interface TargetInput {
  /** Défense (contact) ou réaction (tir) de la cible, si connue. */
  opposition: number | null
  pointFaible: boolean
  /** Barrage subi (cumulable). */
  barrage: number
  /** Lumière subie (non cumulable, contre l'Anathème seulement). */
  lumiere: number
  anatheme: boolean
  humain: boolean
  /** PNJ de type hostile (oblitération). */
  hostile: boolean
  bande: boolean
  /** Chair de la cible (choc, ultraviolence, fureur). */
  chair: number | null
  /** La cible est un PNJ : seuil de choc = Chair ÷ 2. */
  pnj: boolean
  /** Les dégâts atteignent les PA (destructeur) / les PS (meurtrier). */
  touchePa: boolean
  touchePs: boolean
  /** Cible désignée (+1 réussite au tir). */
  designee: boolean
  /** Cible non repérée (FAQ 2020) : +2 en défense au contact, −3 dés et +2 en réaction au tir. */
  invisible: boolean
  /** PNJ de type salopard (annihilation). */
  salopard: boolean
  /** Cible exposée (effet exposer) : +12 dégâts. */
  exposee: boolean
}

export interface AttackOptions {
  style: StyleId
  /** Attaque surprise, Ghost ou Changeling : opposition 0, silencieux, assassin. */
  surprise: boolean
  /** 1 point d'héroïsme : dégâts au maximum. */
  degatsMax: boolean
  /** Mode héroïque : réussites en trop ajoutées aux dégâts et à la violence. */
  heroique: boolean
  /** Dés transférés par le style (pilonnage : tours sur la cible ; puissant : dés échangés). */
  transfert: number
  transfertVers: 'degats' | 'violence'
  /** PE convertis en D6 (effet boost X, Longbow). */
  boost: number
  boostVers: 'degats' | 'violence'
  /** Hostiles humains visés par l'effet fatal (2 dés sacrifiés chacun). */
  fatal: number
}

export interface AttackInput {
  base: CaracId
  combo: CaracId | null
  extra: CaracId | null
  modDes: number
  modReussites: number
  avecOd: boolean
  desSacrifies: number
  profile: WeaponProfile
  /** Identifiants d'améliorations de l'arme. */
  ameliorations: string[]
  target: TargetInput
  options: AttackOptions
}

export const DEFAULT_TARGET: TargetInput = {
  opposition: null,
  pointFaible: false,
  barrage: 0,
  lumiere: 0,
  anatheme: false,
  humain: false,
  hostile: false,
  bande: false,
  chair: null,
  pnj: true,
  touchePa: false,
  touchePs: false,
  designee: false,
  invisible: false,
  salopard: false,
  exposee: false,
}

export const DEFAULT_OPTIONS: AttackOptions = {
  style: 'standard',
  surprise: false,
  degatsMax: false,
  heroique: false,
  transfert: 0,
  transfertVers: 'degats',
  boost: 0,
  boostVers: 'degats',
  fatal: 0,
}

function int(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0
}

function half(value: number, arrondi: 'sup' | 'inf'): number {
  return arrondi === 'sup' ? Math.ceil(value / 2) : Math.floor(value / 2)
}

/** Profil modifié par les améliorations de l'arme (effets, dés, réussites automatiques). */
export function effectiveProfile(
  profile: WeaponProfile,
  ameliorations: readonly string[],
): { profile: WeaponProfile; reussites: number } {
  let degats = profile.degats.des
  let violence = profile.violence.des
  let reussites = 0
  const effets = [...profile.effets]
  for (const id of ameliorations) {
    const up = findUpgrade(id)
    if (!up || up.pour !== profile.type) continue
    degats += up.degats ?? 0
    violence += up.violence ?? 0
    reussites += up.reussites ?? 0
    if (up.ajoute) {
      for (const e of parseEffects(up.ajoute)) if (!effets.some((x) => x.id === e.id && x.id !== 'autre')) effets.push(e)
    }
  }
  return {
    profile: {
      ...profile,
      degats: { ...profile.degats, des: Math.max(0, degats) },
      violence: { ...profile.violence, des: Math.max(0, violence) },
      effets,
    },
    reussites,
  }
}

/**
 * Défense ou réaction effective de la cible : on divise (point faible) puis on soustrait
 * (barrage, lumière), minimum 0. Attaque surprise : 0.
 */
export function effectiveOpposition(
  target: TargetInput,
  options: AttackOptions,
  rules: RulesConfig,
): number | null {
  if (options.surprise) return 0
  if (target.opposition === null) return null
  let value = Math.max(0, int(target.opposition))
  if (target.invisible) value += 2
  if (target.pointFaible) value = half(value, rules.combat.pointFaibleArrondi)
  value -= Math.max(0, int(target.barrage))
  if (target.anatheme) value -= Math.max(0, int(target.lumiere))
  return Math.max(0, value)
}

export interface AttackPlan {
  test: TestPlan
  profile: WeaponProfile
  /** Opposition effective à dépasser, ou `null` si inconnue. */
  opposition: number | null
  /** Dés du style (+ ou −). */
  desStyle: number
  /** Réussites automatiques ajoutées (désignation, améliorations). */
  reussitesBonus: number
  notes: string[]
}

export function planAttack(c: Character, input: AttackInput, rules: RulesConfig): AttackPlan {
  const { profile, reussites } = effectiveProfile(input.profile, input.ameliorations)
  const { target, options } = input
  const notes: string[] = []
  const desStyle = styleAttackDice(options.style, profile.effets, input.ameliorations, options.transfert)
  let modDes = int(input.modDes) + desStyle
  if (target.invisible && profile.type === 'distance' && !options.surprise) {
    modDes -= 3
    notes.push('Cible non repérée : −3 dés au tir.')
  }
  const fatal = hasEffect(profile.effets, 'fatal') ? Math.max(0, int(options.fatal)) : 0
  if (fatal) {
    modDes -= 2 * fatal
    notes.push(`Fatal : ${2 * fatal} dés sacrifiés ; si l’attaque touche, ${fatal} hostile${fatal > 1 ? 's' : ''} humain${fatal > 1 ? 's' : ''} hors de combat.`)
  }
  let bonus = reussites
  if (target.designee && profile.type === 'distance') {
    bonus += 1
    notes.push('Cible désignée : +1 réussite automatique.')
  }
  if (hasEffect(profile.effets, 'lourd')) notes.push('Lourd : l’attaque coûte une action de déplacement et une action de combat.')
  if (options.style === 'precis') notes.push('Style précis : l’attaque coûte aussi une action de déplacement.')
  const opposition = effectiveOpposition(target, options, rules)
  const test = planTest(
    c,
    {
      base: input.base,
      combo: input.combo,
      extra: input.extra,
      modDes,
      modReussites: int(input.modReussites) + bonus,
      avecOd: input.avecOd,
      desSacrifies: input.desSacrifies,
      difficulte: opposition,
    },
    rules,
  )
  return { test, profile, opposition, desStyle, reussitesBonus: bonus, notes }
}

export interface AttackHit {
  /** Touché (`null` si l'opposition est inconnue et le jet n'est pas un échec critique). */
  touche: boolean | null
  /** Réussites au-delà de l'opposition (assistance, mode héroïque), `null` si inconnue. */
  excedent: number | null
}

export function hitOf(result: TestResult): AttackHit {
  const opposition = result.plan.input.difficulte
  if (result.critique) return { touche: false, excedent: null }
  if (opposition === null) return { touche: null, excedent: null }
  return { touche: result.total > opposition, excedent: Math.max(0, result.total - opposition) }
}

/** Élément du détail des dégâts ou de la violence : des dés à lancer ou un bonus fixe. */
export interface DamagePart {
  label: string
  des?: number
  fixe?: number
}

export interface DamagePlan {
  degats: DamagePart[]
  violence: DamagePart[]
  /** Violence de la seconde arme en akimbo : la moitié s'ajoute. */
  akimboViolence: DiceExpr | null
  /** Dégâts au maximum (oblitération contre un hostile, annihilation contre un salopard, héroïsme). */
  maxDegats: boolean
  /** Bourreau X : dés de dégâts ≤ X comptent comme 4. */
  bourreau: number
  /** Dévastation X : dés de violence ≤ X comptent comme 5. */
  devastation: number
  notes: string[]
}

export interface DamageContext {
  /** Réussites totales au toucher (choc), si connues. */
  reussites: number | null
  /** Réussites au-delà de l'opposition (assistance, mode héroïque). */
  excedent: number | null
  /** Nombre de 6 obtenus au jet d'attaque (régularité), si connu. */
  six?: number | null
  target: TargetInput
  options: AttackOptions
  ameliorations: string[]
}

function caracBonus(c: Character, carac: CaracId, rules: RulesConfig): number {
  return c.caracs[carac].val + effectiveOd(c, carac, rules)
}

export function sumDice(parts: readonly DamagePart[]): number {
  return parts.reduce((sum, p) => sum + (p.des ?? 0), 0)
}

export function sumFixed(parts: readonly DamagePart[]): number {
  return parts.reduce((sum, p) => sum + (p.fixe ?? 0), 0)
}

/** Prépare les dégâts et la violence : dés à lancer et bonus, poste par poste (formule de la fiche 08). */
export function planDamage(c: Character, rawProfile: WeaponProfile, ctx: DamageContext, rules: RulesConfig): DamagePlan {
  const { profile } = effectiveProfile(rawProfile, ctx.ameliorations)
  const { target, options } = ctx
  const effets = profile.effets
  const degats: DamagePart[] = []
  const violence: DamagePart[] = []
  const notes: string[] = []
  const akimbo = options.style === 'akimbo'
  const tenebricide = hasEffect(effets, 'tenebricide') && target.humain

  // Dés de l'arme (×2 en akimbo), moitié contre les humains avec ténébricide.
  let desArme = profile.degats.des * (akimbo ? 2 : 1)
  let desViolence = profile.violence.des
  if (tenebricide) {
    desArme = Math.ceil(desArme / 2)
    desViolence = Math.ceil(desViolence / 2)
    notes.push('Ténébricide contre un humain : moitié des dés.')
  }
  if (desArme || profile.degats.fixe) degats.push({ label: akimbo ? 'Arme (×2 akimbo)' : 'Arme', des: desArme, fixe: profile.degats.fixe })
  if (desViolence || profile.violence.fixe) violence.push({ label: 'Arme', des: desViolence, fixe: profile.violence.fixe })

  // Force et overdrives de Force (au contact, ou profils qui l'indiquent).
  const addForce = profile.force ?? profile.type === 'contact'
  if (addForce) {
    const leste = hasEffect(effets, 'leste')
    const force = c.caracs.force.val * (leste ? 2 : 1)
    if (force) degats.push({ label: leste ? 'Force × 2 (lesté)' : 'Force', fixe: force })
    const odForce = effectiveOd(c, 'force', rules)
    if (odForce) degats.push({ label: `OD de Force (${odForce} × ${rules.combat.bonusOdForce})`, fixe: odForce * rules.combat.bonusOdForce })
  }
  if (hasEffect(effets, 'orfevrerie')) degats.push({ label: 'Orfèvrerie (Dextérité + OD)', fixe: caracBonus(c, 'dexterite', rules) })
  if (hasEffect(effets, 'precision')) degats.push({ label: 'Précision (Tir + OD)', fixe: caracBonus(c, 'tir', rules) })
  if (hasEffect(effets, 'sensitif')) degats.push({ label: 'Sensitif (Perception + OD)', fixe: caracBonus(c, 'perception', rules) })
  if (hasEffect(effets, 'chirurgical')) degats.push({ label: 'Chirurgical (Savoir + OD)', fixe: caracBonus(c, 'savoir', rules) })
  if (hasEffect(effets, 'regularite') && ctx.six) degats.push({ label: `Régularité (${ctx.six} × 6)`, fixe: 3 * ctx.six })
  if (target.exposee) degats.push({ label: 'Cible exposée', fixe: 12 })
  if (ctx.ameliorations.includes('sur-mesure') && profile.type === 'contact') {
    degats.push({ label: 'Sur mesure (Combat + OD)', fixe: caracBonus(c, 'combat', rules) })
  }
  if (options.surprise) {
    if (hasEffect(effets, 'silencieux')) degats.push({ label: 'Silencieux (Discrétion + OD)', fixe: caracBonus(c, 'discretion', rules) })
    const assassin = effectValue(effets, 'assassin')
    if (assassin) degats.push({ label: `Assassin ${assassin}`, des: assassin })
  }
  if (options.style === 'agressif' && ctx.ameliorations.includes('agressive') && profile.type === 'contact') {
    degats.push({ label: 'Agressive', des: 1 })
  }

  // Assistance à l'attaque : sur la violence contre une bande, sinon sur les dégâts.
  const excedent = ctx.excedent ?? 0
  if (hasEffect(effets, 'excellence') && excedent > 0) {
    ;(target.bande ? violence : degats).push({ label: 'Excellence (3 par réussite en trop)', fixe: 3 * excedent })
  } else if (hasEffect(effets, 'assistance') && excedent > 0) {
    ;(target.bande ? violence : degats).push({ label: 'Assistance à l’attaque', fixe: excedent })
  }
  if (target.touchePa && hasEffect(effets, 'destructeur')) degats.push({ label: 'Destructeur (PA touchés)', des: 2 })
  if (target.touchePs && hasEffect(effets, 'meurtrier')) degats.push({ label: 'Meurtrier (PS touchés)', des: 2 })

  // Violence contre les bandes.
  if (target.bande && target.chair !== null) {
    if (hasEffect(effets, 'ultraviolence') && target.chair < 10) violence.push({ label: 'Ultraviolence', des: 2 })
    if (hasEffect(effets, 'fureur') && target.chair >= 10) violence.push({ label: 'Fureur', des: 4 })
  }
  if (target.bande) notes.push('Contre une bande, seule la violence compte (cohésion).')

  // Dés transférés par le style.
  if (styleTransfersDice(options.style) && options.transfert > 0) {
    const n = Math.min(6, Math.max(0, Math.trunc(options.transfert)))
    const label = options.style === 'puissant' ? 'Style puissant' : 'Style pilonnage'
    ;(options.transfertVers === 'violence' ? violence : degats).push({ label, des: n })
  }

  // Boost : 1D6 par PE dépensé.
  if (options.boost > 0) {
    ;(options.boostVers === 'violence' ? violence : degats).push({ label: `Boost (${options.boost} PE)`, des: Math.trunc(options.boost) })
  }

  // Mode héroïque : réussites en trop, en points ou en D6 selon la règle.
  if (options.heroique && excedent > 0) {
    const part = rules.combat.modeHeroique === 'des' ? { des: excedent } : { fixe: excedent }
    degats.push({ label: 'Mode héroïque', ...part })
    violence.push({ label: 'Mode héroïque', ...part })
  }

  // Choc : réussites au-delà de la Chair (÷ 2 pour un PNJ).
  const choc = effectValue(effets, 'choc')
  if (choc && ctx.reussites !== null && target.chair !== null && !target.bande) {
    const seuil = target.pnj ? Math.ceil(target.chair / 2) : target.chair
    if (ctx.reussites > seuil) notes.push(`Choc ${choc} : la cible perd ${choc} action${choc > 1 ? 's' : ''}.`)
  }

  const obliteration = hasEffect(effets, 'obliteration') && target.hostile
  const annihilation = hasEffect(effets, 'annihilation') && target.salopard
  const maxDegats = options.degatsMax || obliteration || annihilation
  if (maxDegats) {
    notes.push(
      options.degatsMax ? 'Héroïsme : dégâts au maximum.'
        : annihilation ? 'Annihilation contre un salopard : dégâts au maximum.'
          : 'Oblitération contre un hostile : dégâts au maximum.',
    )
  }
  const bourreau = effectValue(effets, 'bourreau')
  const devastation = effectValue(effets, 'devastation')
  if (bourreau) notes.push(`Bourreau ${bourreau} : dés de dégâts ≤ ${bourreau} comptés comme 4.`)
  if (devastation) notes.push(`Dévastation ${devastation} : dés de violence ≤ ${devastation} comptés comme 5.`)

  const akimboViolence = akimbo ? { des: desViolence, fixe: profile.violence.fixe } : null
  return { degats, violence, akimboViolence, maxDegats, bourreau, devastation, notes }
}

export interface DamageResult {
  plan: DamagePlan
  /** Faces lancées (mode virtuel) ou `null` (somme saisie). */
  facesDegats: number[] | null
  facesViolence: number[] | null
  sommeDegats: number
  sommeViolence: number
  /** Violence ajoutée par la seconde arme (akimbo). */
  violenceAkimbo: number
  degats: number
  violence: number
}

/** Total à partir des sommes de dés (vrais dés) ou des faces lancées. */
export function resolveDamage(
  plan: DamagePlan,
  degats: number[] | number,
  violence: number[] | number,
  akimboViolenceSum: number | null,
  rules: RulesConfig,
): DamageResult {
  const facesDegats = Array.isArray(degats) ? degats.map((f) => (f <= plan.bourreau ? 4 : f)) : null
  const facesViolence = Array.isArray(violence) ? violence.map((f) => (f <= plan.devastation ? 5 : f)) : null
  const desDegats = sumDice(plan.degats)
  const sommeDegats = plan.maxDegats ? desDegats * 6 : facesDegats ? facesDegats.reduce((a, b) => a + b, 0) : int(degats as number)
  const sommeViolence = facesViolence ? facesViolence.reduce((a, b) => a + b, 0) : int(violence as number)
  const violenceAkimbo =
    plan.akimboViolence && akimboViolenceSum !== null
      ? half(akimboViolenceSum + plan.akimboViolence.fixe, rules.combat.akimboArrondi)
      : 0
  return {
    plan,
    facesDegats: plan.maxDegats ? null : facesDegats,
    facesViolence,
    sommeDegats,
    sommeViolence,
    violenceAkimbo,
    degats: Math.max(0, sommeDegats + sumFixed(plan.degats)),
    violence: Math.max(0, sommeViolence + sumFixed(plan.violence) + violenceAkimbo),
  }
}

/** « 3D6 Arme + 5 Force + 6 OD de Force » */
export function describeParts(parts: readonly DamagePart[], somme?: number): string {
  const des = sumDice(parts)
  const bits: string[] = []
  if (des) bits.push(`${des}D6${somme !== undefined ? ` (${somme})` : ''}`)
  for (const p of parts) if (p.fixe) bits.push(`${p.fixe} ${p.label}`)
  return bits.join(' + ') || '0'
}
