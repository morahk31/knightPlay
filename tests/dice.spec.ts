import { describe, expect, it } from 'vitest'
import {
  binomialAtLeast,
  binomialExactly,
  chanceToBeat,
  countSuccesses,
  parseFaces,
  rollD6,
} from '../src/rules/dice'
import { facesRng } from './helpers'


/** Probabilité par énumération exhaustive de toutes les combinaisons de faces paires/impaires. */
function bruteForce(n: number, auto: number, difficulty: number, exploit: boolean): number {
  if (n === 0) return 0
  let p = 0
  const outcomes = 2 ** n
  for (let mask = 0; mask < outcomes; mask++) {
    const x = mask.toString(2).split('').filter((b) => b === '1').length
    if (x === 0) continue
    if (x === n && exploit) {
      for (let mask2 = 0; mask2 < outcomes; mask2++) {
        const y = mask2.toString(2).split('').filter((b) => b === '1').length
        if (x + y + auto > difficulty) p += 1 / outcomes / outcomes
      }
    } else if (x + auto > difficulty) {
      p += 1 / outcomes
    }
  }
  return p
}

describe('dés', () => {
  it('compte une réussite par face paire', () => {
    expect(countSuccesses([1, 2, 3, 4, 5, 6])).toBe(3)
    expect(countSuccesses([])).toBe(0)
  })

  it('lance le nombre de dés demandé avec la RNG fournie', () => {
    expect(rollD6(4, facesRng([6, 1, 3, 2]))).toEqual([6, 1, 3, 2])
    expect(rollD6(0)).toEqual([])
    expect(rollD6(-2)).toEqual([])
    const faces = rollD6(200)
    expect(faces.every((f) => f >= 1 && f <= 6)).toBe(true)
  })

  it('loi binomiale B(n, ½)', () => {
    expect(binomialExactly(2, 1)).toBe(0.5)
    expect(binomialAtLeast(7, 0)).toBe(1)
    expect(binomialAtLeast(3, 3)).toBe(1 / 8)
    expect(binomialAtLeast(7, 3)).toBeCloseTo(99 / 128, 10)
  })

  it('7 dés et 3 auto contre 5 = P(X ≥ 3) avec X ~ B(7, ½)', () => {
    expect(chanceToBeat(7, 3, 5)).toBeCloseTo(binomialAtLeast(7, 3), 10)
  })

  it('l’échec critique compte : 1 dé et 5 auto contre 0 = 50 %', () => {
    expect(chanceToBeat(1, 5, 0)).toBe(0.5)
  })

  it('un pool de 0 dé échoue toujours', () => {
    expect(chanceToBeat(0, 10, 1)).toBe(0)
  })

  it('correspond à l’énumération exhaustive, avec ou sans exploit', () => {
    for (let n = 1; n <= 6; n++) {
      for (const auto of [0, 2]) {
        for (const diff of [0, 2, 4, 7, 11]) {
          for (const exploit of [true, false]) {
            expect(chanceToBeat(n, auto, diff, { exploit })).toBeCloseTo(bruteForce(n, auto, diff, exploit), 10)
          }
        }
      }
    }
  })

  it('lit des faces saisies et rejette les valeurs invalides', () => {
    expect(parseFaces('2 4 5 6')).toEqual([2, 4, 5, 6])
    expect(parseFaces('2,4;1')).toEqual([2, 4, 1])
    expect(parseFaces('2 7')).toBeNull()
    expect(parseFaces('')).toEqual([])
  })
})
