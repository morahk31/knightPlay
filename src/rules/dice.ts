/**
 * Moteur de dés du système combo (référentiel, fiche 01) :
 * pool de D6, une réussite par face paire.
 */

/** Générateur aléatoire dans [0, 1), injectable pour les tests. */
export type Rng = () => number

export function rollD6(count: number, rng: Rng = Math.random): number[] {
  const n = Math.max(0, Math.trunc(count))
  return Array.from({ length: n }, () => 1 + Math.floor(rng() * 6))
}

/** Une réussite par face paire (2, 4, 6). */
export function countSuccesses(faces: readonly number[]): number {
  return faces.filter((f) => f % 2 === 0).length
}

function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i
  return result
}

/** P(X = k) pour X ~ B(n, ½). */
export function binomialExactly(n: number, k: number): number {
  return binomialCoefficient(n, k) / 2 ** n
}

/** P(X ≥ k) pour X ~ B(n, ½). */
export function binomialAtLeast(n: number, k: number): number {
  if (k <= 0) return 1
  let p = 0
  for (let i = k; i <= n; i++) p += binomialExactly(n, i)
  return p
}

export interface ChanceOptions {
  /** Relance d'exploit active (tous les dés pairs → relance ajoutée). */
  exploit: boolean
}

/**
 * Probabilité de **dépasser** la difficulté avec `dice` dés et `auto` réussites automatiques,
 * en tenant compte de l'échec critique (aucun dé pair = échec, même avec des OD)
 * et de l'exploit (tous les dés pairs = relance dont les réussites s'ajoutent, OD non recomptés).
 * Un pool de 0 dé échoue toujours.
 */
export function chanceToBeat(
  dice: number,
  auto: number,
  difficulty: number,
  options: ChanceOptions = { exploit: true },
): number {
  const n = Math.max(0, Math.trunc(dice))
  if (n === 0) return 0
  let p = 0
  for (let x = 1; x <= n; x++) {
    const px = binomialExactly(n, x)
    if (x === n && options.exploit) {
      // Exploit : la relance ajoute Y ~ B(n, ½) réussites.
      p += px * binomialAtLeast(n, difficulty + 1 - auto - n)
    } else if (x + auto > difficulty) {
      p += px
    }
  }
  return p
}

/** Lit des faces saisies (« 2 4 5 6 », « 2,4,5 »…). Renvoie `null` si une valeur n'est pas un D6. */
export function parseFaces(text: string): number[] | null {
  const tokens = text.split(/[^0-9]+/).filter((t) => t !== '')
  const faces = tokens.map(Number)
  return faces.every((f) => Number.isInteger(f) && f >= 1 && f <= 6) ? faces : null
}
