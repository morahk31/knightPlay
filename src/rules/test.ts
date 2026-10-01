import { CARAC_LABELS } from './catalog'
import { chanceToBeat, countSuccesses } from './dice'
import type { CaracId, Character, RulesConfig } from './types'

/** Paramètres d'un test de caractéristiques (système combo, fiche 01). */
export interface TestInput {
  base: CaracId
  /** Caractéristique en combo (différente de la base). */
  combo: CaracId | null
  /** 3ᵉ caractéristique ajoutée en dépensant 1 point d'héroïsme (fiche 05). */
  extra: CaracId | null
  /** Dés ajoutés (+) ou retirés (−) : style, situation, module… */
  modDes: number
  /** Réussites automatiques ajoutées (+) ou retirées (−). */
  modReussites: number
  /** Les OD des caractéristiques utilisées comptent-ils ? */
  avecOd: boolean
  /** Dés sacrifiés par paires (règle optionnelle). */
  desSacrifies: number
  /** Difficulté ou opposition à dépasser ; `null` = test sans seuil. */
  difficulte: number | null
}

/** Ce qu'il faut lancer, avant le jet. */
export interface TestPlan {
  input: TestInput
  /** Caractéristiques retenues (base, combo, 3ᵉ). */
  caracs: CaracId[]
  /** Somme des scores des caractéristiques. */
  desCaracs: number
  /** Dés retirés par le désespoir (espoir sous le seuil). */
  malusEspoir: number
  /** Dés retirés par le sacrifice (paires). */
  desSacrifies: number
  /** Nombre de dés à lancer (jamais négatif). */
  des: number
  /** Réussites automatiques : OD + bonus + sacrifice. */
  auto: number
  /** Probabilité de dépasser la difficulté, ou `null` sans difficulté. */
  chance: number | null
  /** Problèmes bloquants (ex. combo identique à la base). */
  erreurs: string[]
}

export interface TestResult {
  plan: TestPlan
  /** Faces du jet, si connues (mode virtuel ou saisie des faces). */
  faces: number[] | null
  /** Réussites obtenues aux dés (premier jet). */
  reussitesDes: number
  critique: boolean
  exploit: boolean
  /** Faces de la relance d'exploit, si connues. */
  facesExploit: number[] | null
  /** Réussites de la relance d'exploit. */
  reussitesExploit: number
  /** Total des réussites (dés + relance + automatiques). */
  total: number
  /** Résultat face à la difficulté ; `null` sans difficulté. */
  reussi: boolean | null
}

function trunc(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 0
}

/** Prépare un test : nombre de dés, réussites automatiques, probabilité. */
export function planTest(c: Character, input: TestInput, rules: RulesConfig): TestPlan {
  const erreurs: string[] = []
  const caracs: CaracId[] = [input.base]
  if (input.combo) {
    if (input.combo === input.base) erreurs.push('La combo doit être différente de la base.')
    else caracs.push(input.combo)
  }
  if (input.extra) {
    if (caracs.includes(input.extra)) erreurs.push('La 3ᵉ caractéristique doit être différente des deux autres.')
    else caracs.push(input.extra)
  }

  const desCaracs = caracs.reduce((sum, id) => sum + c.caracs[id].val, 0)
  const od = input.avecOd ? caracs.reduce((sum, id) => sum + c.caracs[id].od, 0) : 0
  const malusEspoir = Math.max(0, rules.systeme.seuilDesespoir - c.jauges.espoir.actuel)

  const avantSacrifice = Math.max(0, desCaracs + trunc(input.modDes) - malusEspoir)
  const paires = rules.systeme.sacrificeDes
    ? Math.min(Math.floor(Math.max(0, trunc(input.desSacrifies)) / 2), Math.floor(avantSacrifice / 2))
    : 0
  const desSacrifies = paires * 2
  const des = avantSacrifice - desSacrifies
  const auto = Math.max(0, od + trunc(input.modReussites) + paires)

  const chance =
    input.difficulte === null || erreurs.length > 0
      ? null
      : chanceToBeat(des, auto, input.difficulte, { exploit: rules.systeme.exploitRelance })

  return { input, caracs, desCaracs, malusEspoir, desSacrifies, des, auto, chance, erreurs }
}

function finish(
  plan: TestPlan,
  faces: number[] | null,
  reussitesDes: number,
  facesExploit: number[] | null,
  reussitesExploit: number,
  rules: RulesConfig,
): TestResult {
  const critique = plan.des === 0 || reussitesDes === 0
  const exploit = !critique && rules.systeme.exploitRelance && reussitesDes === plan.des
  const relance = exploit ? reussitesExploit : 0
  const total = critique ? 0 : reussitesDes + relance + plan.auto
  const reussi = plan.input.difficulte === null ? (critique ? false : null) : !critique && total > plan.input.difficulte
  return {
    plan,
    faces,
    reussitesDes,
    critique,
    exploit,
    facesExploit: exploit ? facesExploit : null,
    reussitesExploit: relance,
    total,
    reussi,
  }
}

/**
 * Résout un test à partir des faces lancées (mode virtuel ou faces saisies).
 * `facesExploit` est utilisé seulement en cas d'exploit.
 */
export function resolveFromFaces(
  plan: TestPlan,
  faces: number[],
  facesExploit: number[] | null,
  rules: RulesConfig,
): TestResult {
  const reussites = countSuccesses(faces)
  const relance = facesExploit ? countSuccesses(facesExploit) : 0
  return finish(plan, faces, reussites, facesExploit, relance, rules)
}

/**
 * Résout un test à partir du seul nombre de réussites obtenues aux dés (vrais dés).
 * 0 réussite = échec critique ; autant de réussites que de dés = exploit.
 */
export function resolveFromCount(
  plan: TestPlan,
  reussitesDes: number,
  reussitesExploit: number,
  rules: RulesConfig,
): TestResult {
  const reussites = Math.min(Math.max(0, trunc(reussitesDes)), plan.des)
  const relance = Math.min(Math.max(0, trunc(reussitesExploit)), plan.des)
  return finish(plan, null, reussites, null, relance, rules)
}

/** Libellé du combo, ex. « Déplacement + Force (+ Hargne) ». */
export function comboLabel(plan: TestPlan): string {
  const [base, ...others] = plan.caracs
  const parts = [CARAC_LABELS[base!], ...others.map((c) => CARAC_LABELS[c])]
  return parts.join(' + ')
}

/** Résumé textuel d'un résultat, pour le journal. */
export function describeResult(result: TestResult): string {
  const { plan } = result
  const bits = [`${plan.des} dé${plan.des > 1 ? 's' : ''}`]
  if (result.faces) bits.push(`[${result.faces.join(' ')}]`)
  bits.push(`${result.reussitesDes} réussite${result.reussitesDes > 1 ? 's' : ''}`)
  if (result.exploit) {
    bits.push(`exploit +${result.reussitesExploit}${result.facesExploit ? ` [${result.facesExploit.join(' ')}]` : ''}`)
  }
  if (plan.auto) bits.push(`+${plan.auto} auto`)
  if (plan.malusEspoir) bits.push(`désespoir −${plan.malusEspoir} dé${plan.malusEspoir > 1 ? 's' : ''}`)
  bits.push(`= ${result.total}`)
  if (plan.input.difficulte !== null) bits.push(`contre ${plan.input.difficulte}`)
  return bits.join(' · ')
}
