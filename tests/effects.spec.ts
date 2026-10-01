import { describe, expect, it } from 'vitest'
import { EFFECTS, effectLabel, effectValue, formatEffects, parseEffects } from '../src/rules/effects'
import { WEAPONS, WEAPON_UPGRADES, findWeapon, formatDice, parseDice } from '../src/data/weapons'

describe('catalogue des effets', () => {
  it('chaque effet a un identifiant unique, un libellé et une description', () => {
    expect(new Set(EFFECTS.map((e) => e.id)).size).toBe(EFFECTS.length)
    for (const e of EFFECTS) {
      expect(e.label.length).toBeGreaterThan(2)
      expect(e.description.length).toBeGreaterThan(10)
    }
  })

  it('analyse la notation des profils', () => {
    const effets = parseEffects('Meurtrier, perce armure 40, jumelé (akimbo), assistance à l’attaque, effet maison')
    expect(effets.map((e) => e.id)).toEqual(['meurtrier', 'perce-armure', 'jumele-akimbo', 'assistance', 'autre'])
    expect(effectValue(effets, 'perce-armure')).toBe(40)
    expect(effectLabel(effets[1]!)).toBe('perce armure 40')
    expect(formatEffects(parseEffects('choc 2, lesté'))).toBe('choc 2, lesté')
  })

  it('tous les effets des armes et des améliorations du catalogue sont reconnus', () => {
    const inconnus = WEAPONS.flatMap((w) => w.profils.flatMap((p) => p.effets.filter((e) => e.id === 'autre').map((e) => `${w.nom} : ${e.label}`)))
    const upgrades = WEAPON_UPGRADES.flatMap((u) => (u.ajoute ? parseEffects(u.ajoute) : [])).filter((e) => e.id === 'autre')
    expect(inconnus).toEqual([])
    expect(upgrades).toEqual([])
  })
})

describe('catalogue des armes', () => {
  it('lit et écrit les expressions de dés', () => {
    expect(parseDice('3D6+12')).toEqual({ des: 3, fixe: 12 })
    expect(parseDice('1D6')).toEqual({ des: 1, fixe: 0 })
    expect(parseDice('2')).toEqual({ des: 0, fixe: 2 })
    expect(formatDice({ des: 4, fixe: 6 })).toBe('4D6+6')
  })

  it('reprend les profils exacts du référentiel', () => {
    expect(new Set(WEAPONS.map((w) => w.id)).size).toBe(WEAPONS.length)
    expect(WEAPONS.length).toBeGreaterThanOrEqual(60)
    const fusil = findWeapon('fusil-precision')!.profils[0]!
    expect(fusil).toMatchObject({ type: 'distance', degats: { des: 4, fixe: 6 }, violence: { des: 1, fixe: 0 }, portee: 'lointaine' })
    const epee = findWeapon('epee-batarde')!
    expect(epee.pg).toBe(30)
    expect(epee.profils.map((p) => p.degats.des)).toEqual([4, 4])
    expect(findWeapon('lance-flammes')!.profils[0]!.violence).toEqual({ des: 8, fixe: 12 })
    expect(findWeapon('marteau-epieu')!.profils[1]!.type).toBe('distance')
  })
})
