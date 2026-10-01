import { parseEffects } from '../rules/effects'
import type { DiceExpr, Disponibilite, Portee, WeaponDef, WeaponProfile, WeaponUpgradeDef } from '../rules/types'

/**
 * Arsenal (référentiel : fiche 08 pour le livre de base, fiche 13 pour 2038 et le codex 4).
 * Les dégâts ne contiennent que XD6 + fixe : la Force (contact), Dextérité (orfèvrerie),
 * Tir (précision) et Force × 2 (lesté) sont ajoutés par le calcul d'attaque.
 */

/** « 3D6+6 », « 1D6 », « 2+… » → { des, fixe } */
export function parseDice(text: string): DiceExpr {
  const clean = text.replace(/\s+/g, '').toUpperCase()
  const match = /^(?:(\d+)D6?)?(?:\+?(-?\d+))?$/.exec(clean)
  if (!match) return { des: 0, fixe: 0 }
  return { des: Number(match[1] ?? 0), fixe: Number(match[2] ?? 0) }
}

export function formatDice(d: DiceExpr): string {
  if (!d.des) return String(d.fixe)
  return d.fixe ? `${d.des}D6${d.fixe > 0 ? '+' : ''}${d.fixe}` : `${d.des}D6`
}

function p(
  nom: string,
  type: 'contact' | 'distance',
  degats: string,
  violence: string,
  portee: Portee,
  effets: string,
  extra: { energie?: string; force?: boolean } = {},
): WeaponProfile {
  return { nom, type, degats: parseDice(degats), violence: parseDice(violence), portee, effets: parseEffects(effets), ...extra }
}

function w(
  id: string,
  nom: string,
  dispo: Disponibilite,
  pg: number,
  source: string,
  profils: WeaponProfile[],
  notes?: string,
): WeaponDef {
  const categorie = profils.every((x) => x.type === 'distance') ? 'distance' : 'contact'
  return { id, nom, categorie, dispo, pg, profils, source, ...(notes ? { notes } : {}) }
}

const LDB_S = 'LdB p. 421-422'
const LDB_A = 'LdB p. 423-425'
const LDB_R = 'LdB p. 425-427'
const T38 = '2038 p. 25-26'
const C4 = 'Codex 4 p. 9-12'
const LG_ALL = 'assistance à l’attaque, lourd, deux mains'
const CARREAU = 'silencieux, deux mains, précision'

export const WEAPONS: readonly WeaponDef[] = [
  // Équipement de base
  w('grenades', 'Grenades intelligentes', 'standard', 0, 'LdB p. 419', [
    p('Shrapnel', 'distance', '3D6', '3D6', 'courte', 'ultraviolence, meurtrier, dispersion 6, chargeur 5'),
    p('Flashbang', 'distance', '0', '0', 'courte', 'choc 1, barrage 2, lumière 2, dispersion 6, chargeur 5'),
    p('Anti-blindage', 'distance', '3D6', '3D6', 'courte', 'destructeur, perce armure 20, pénétrant 6, dispersion 6, chargeur 5'),
    p('IEM', 'distance', '0', '0', 'courte', 'parasitage 2, dispersion 6, chargeur 5'),
    p('Explosive', 'distance', '3D6', '3D6', 'courte', 'anti-véhicule, dispersion 3, choc 1, chargeur 5'),
  ], 'Base Tir. Portée +1 cran par OD de Force. Ignorent les bonus de couvert. Explosive : +3D6 contre objets et véhicules.'),

  // Standards (LdB)
  w('pistolet-service', 'Pistolet de service', 'standard', 15, LDB_S, [
    p('Tir', 'distance', '2D6+6', '1D6', 'moyenne', 'silencieux'),
    p('Couteau', 'contact', '1D6', '1', 'contact', 'silencieux'),
  ]),
  w('shotgun-escamotable', 'Shotgun escamotable', 'standard', 20, LDB_S, [
    p('Tir', 'distance', '2D6+10', '2D6', 'moyenne', 'meurtrier, choc 1, barrage 2, deux mains'),
  ]),
  w('pistolet-mitrailleur', 'Pistolet mitrailleur', 'standard', 25, LDB_S, [
    p('Tir', 'distance', '3D6', '4D6', 'moyenne', 'meurtrier, ultraviolence, jumelé (akimbo)'),
  ]),
  w('fusil-assaut', 'Fusil d’assaut', 'standard', 30, LDB_S, [
    p('Tir', 'distance', '2D6+6', '3D6+9', 'longue', 'ultraviolence, barrage 2, deux mains'),
  ]),
  w('lance-grenade-leger', 'Lance-grenade léger', 'standard', 40, LDB_S, [
    p('Explosive', 'distance', '4D6', '3D6', 'moyenne', 'dispersion 3'),
    p('Anti-blindage', 'distance', '3D6+10', '1', 'moyenne', 'destructeur'),
    p('Incendiaire', 'distance', '2D6', '3D6+10', 'moyenne', 'dégâts continus 3'),
  ], 'Changer de grenade : 1 tour.'),
  w('fusil-precision', 'Fusil de précision', 'standard', 40, LDB_S, [
    p('Tir', 'distance', '4D6+6', '1D6', 'lointaine', 'tir en sécurité, précision, assistance à l’attaque, désignation, deux mains'),
  ]),
  w('marteau-epieu', 'Marteau-épieu', 'standard', 10, LDB_S, [
    p('Contact', 'contact', '3D6', '1D6', 'contact', 'perce armure 40'),
    p('Tir', 'distance', '3D6+12', '3D6+12', 'courte', 'dégâts continus 3, dispersion 3, lumière 2, chargeur 1'),
  ]),
  w('morgenstern', 'Morgenstern', 'standard', 15, LDB_S, [p('Contact', 'contact', '3D6', '1D6', 'contact', 'lesté')]),
  w('couteau-combat', 'Couteau de combat', 'standard', 15, LDB_S, [
    p('Contact', 'contact', '3D6', '1D6', 'contact', 'orfèvrerie, silencieux, jumelé (ambidextrie)'),
  ]),
  w('bouclier-amovible', 'Bouclier amovible', 'standard', 20, LDB_S, [
    p('Contact', 'contact', '1', '1', 'contact', 'défense 2, jumelé (ambidextrie)'),
    p('Déployé (tir)', 'distance', '2D6+6', '2D6+6', 'courte', 'lumière 4, anti-Anathème, chargeur 1'),
  ]),
  w('ceste-lourd', 'Ceste lourd', 'standard', 20, LDB_S, [p('Contact', 'contact', '3D6', '1D6', 'contact', 'lesté, jumelé (akimbo)')]),
  w('epee-batarde', 'Épée bâtarde', 'standard', 30, LDB_S, [
    p('1 main', 'contact', '4D6', '2D6', 'contact', 'orfèvrerie'),
    p('2 mains', 'contact', '4D6', '3D6', 'contact', 'lesté, deux mains'),
  ]),

  // Avancées (LdB)
  w('lance-missile', 'Lance-missile', 'avance', 15, LDB_A, [
    p('Missiles', 'distance', '7D6+10', '3D6', 'lointaine', 'artillerie, anti-véhicule, assistance à l’attaque, lourd, deux mains'),
    p('Roquettes', 'distance', '3D6', '7D6+10', 'lointaine', 'dispersion 6, fureur, assistance à l’attaque, lourd, deux mains'),
  ], '+10 PG pour 5 projectiles, à usage unique.'),
  w('mitrailleuse-lourde', 'Mitrailleuse lourde', 'avance', 45, LDB_A, [
    p('Tir', 'distance', '5D6+10', '4D6', 'moyenne', 'perce armure 20, destructeur, lourd, deux mains'),
  ]),
  w('pistolet-infiltration', 'Pistolet d’infiltration', 'avance', 50, LDB_A, [
    p('Neurotoxine', 'distance', '4D6', '1', 'moyenne', 'ignore armure, dégâts continus 3, silencieux, jumelé (ambidextrie)'),
    p('Choc', 'distance', '3D6', '1', 'moyenne', 'ignore armure, choc 2, silencieux, jumelé (ambidextrie)'),
    p('Nanomachines', 'distance', '4D6+6', '1', 'moyenne', 'destructeur, silencieux, jumelé (ambidextrie)'),
  ]),
  w('lance-grenade-lourd', 'Lance-grenade lourd', 'avance', 60, LDB_A, [
    p('Explosive', 'distance', '5D6', '3D6+6', 'moyenne', `dispersion 3, ${LG_ALL}`),
    p('Anti-blindage', 'distance', '5D6+6', '1D6', 'moyenne', `destructeur, ${LG_ALL}`),
    p('Incendiaire', 'distance', '2D6', '6D6+6', 'moyenne', `dégâts continus 3, ${LG_ALL}`),
    p('Adhésive', 'distance', '6D6', '3D6', 'moyenne', `dispersion 3, ${LG_ALL}`),
  ]),
  w('fusil-anti-materiel', 'Fusil anti-matériel', 'avance', 60, LDB_A, [
    p('Tir', 'distance', '5D6+6', '2D6', 'lointaine', 'destructeur, perce armure 40, précision, assistance à l’attaque, tir en sécurité, désignation, lourd, deux mains'),
  ]),
  w('shotgun-automatique', 'Shotgun automatique', 'avance', 70, LDB_A, [
    p('Tir', 'distance', '4D6+10', '6D6+10', 'moyenne', 'dispersion 3, démoralisant, ultraviolence, barrage 4, lourd, deux mains'),
  ]),
  w('ceste-repulsif', 'Ceste répulsif', 'avance', 30, LDB_A, [
    p('Contact', 'contact', '5D6', '2D6', 'contact', 'défense 2, choc 2, jumelé (akimbo)', { energie: '1 PE par tour pour défense 2' }),
  ]),
  w('epee-longue', 'Épée longue', 'avance', 35, LDB_A, [p('Contact', 'contact', '5D6', '5D6', 'contact', 'lesté, deux mains, choc 1, défense 1')]),
  w('dague', 'Dague', 'avance', 40, LDB_A, [
    p('Contact', 'contact', '3D6', '1', 'contact', 'ignore armure, silencieux, orfèvrerie, assistance à l’attaque, jumelé (ambidextrie)'),
  ]),
  w('belier-piston', 'Bélier à piston', 'avance', 40, LDB_A, [
    p('Contact', 'contact', '6D6', '1D6', 'contact', 'destructeur, lesté, choc 1, assistance à l’attaque'),
  ]),
  w('matraques-electriques', 'Matraques électriques (la paire)', 'avance', 40, LDB_A, [
    p('Contact', 'contact', '5D6', '5D6', 'contact', 'en chaîne, choc 4, meurtrier, barrage 4, deux mains'),
  ], 'Une seule arme à deux mains (pas d’akimbo), FAQ 2020.'),
  w('sabre-brulant', 'Sabre brûlant', 'avance', 40, LDB_A, [
    p('Contact', 'contact', '5D6', '3D6', 'contact', 'orfèvrerie, lumière 4, anti-Anathème, meurtrier, jumelé (ambidextrie)'),
  ]),
  w('targe-amovible', 'Targe amovible', 'avance', 45, LDB_A, [
    p('Pliée', 'contact', '2', '2', 'contact', 'défense 2, main libre'),
    p('Dépliée', 'contact', '2', '2', 'contact', 'défense 3, réaction 3, choc 1, jumelé (ambidextrie)'),
  ]),
  w('fleau-repulsif', 'Fléau répulsif', 'avance', 55, LDB_A, [
    p('Contact', 'contact', '7D6', '4D6', 'contact', 'choc 2, dispersion 3, en chaîne, barrage 3', { energie: '1 PE par action' }),
  ], '0 réussite : l’utilisateur subit les dégâts.'),
  w('torche-plasma', 'Torche plasma', 'avance', 50, LDB_A, [
    p('Contact', 'contact', '6D6', '4D6', 'contact', 'perce armure 60, fureur, lumière 4, destructeur, défense 2, deux mains'),
  ]),

  // Rares (LdB)
  w('revolver-lourd', 'Revolver lourd', 'rare', 70, LDB_R, [
    p('600 NE', 'distance', '6D6+10', '1D6', 'moyenne', 'meurtrier, perce armure 40, pénétrant 10'),
    p('T-800', 'distance', '6D6+20', '2D6', 'moyenne', 'ignore armure, anti-véhicule, ignore CdF'),
  ], 'Balles T-800 : 5 PG l’unité, usage unique.'),
  w('fusil-laser', 'Fusil laser', 'rare', 70, LDB_R, [
    p('Tir', 'distance', '4D6+6', '3D6', 'moyenne', 'ignore CdF, anti-Anathème, lumière 4, deux mains',
      { energie: '1 PE par tir ; +1D6 dégâts ou violence par PE (7D6 max)' }),
  ]),
  w('arbalete-magnetique', 'Arbalète magnétique', 'rare', 70, LDB_R, [
    p('Barbelé', 'distance', '6D6', '1', 'longue', `ignore armure, ${CARREAU}`),
    p('Neurotoxine', 'distance', '5D6', '1', 'longue', `dégâts continus 9, ignore armure, ${CARREAU}`),
    p('Choc', 'distance', '4D6', '1', 'longue', `ignore armure, choc 4, ${CARREAU}`),
    p('Nanomachines', 'distance', '6D6+6', '1', 'longue', `destructeur, anti-véhicule, lumière 4, ${CARREAU}`),
  ]),
  w('shotgun-automatique-lourd', 'Shotgun automatique lourd', 'rare', 80, LDB_R, [
    p('Tir', 'distance', '6D6+12', '6D6+12', 'moyenne', 'dispersion 6, fureur, démoralisant, lourd, deux mains'),
  ]),
  w('railgun', 'Railgun', 'rare', 90, LDB_R, [
    p('Tir', 'distance', '5D6+10', '1D6', 'lointaine', 'précision, ignore armure, anti-véhicule, désignation, artillerie, assistance à l’attaque, deux mains'),
  ]),
  w('lance-flammes', 'Lance-flammes', 'rare', 100, LDB_R, [
    p('Tir', 'distance', '4D6', '8D6+12', 'moyenne', 'dégâts continus 6, démoralisant, dispersion 6, fureur, barrage 5, lumière 2, lourd, deux mains'),
  ]),
  w('hache-reaction', 'Hache à réaction', 'rare', 60, LDB_R, [
    p('Contact', 'contact', '6D6', '4D6', 'contact', 'ignore CdF, orfèvrerie, lesté, en chaîne, assistance à l’attaque'),
  ]),
  w('pavois', 'Pavois', 'rare', 60, LDB_R, [
    p('Contact', 'contact', '2', '2', 'contact', 'défense 4, réaction 4, jumelé (ambidextrie)'),
    p('Charge', 'distance', '10', '1D6', 'courte', 'choc 2, lesté', { force: true }),
  ], 'Charge : action de déplacement.'),
  w('epee-cinetique', 'Épée cinétique', 'rare', 70, LDB_R, [
    p('Contact', 'contact', '6D6', '3D6', 'contact', 'orfèvrerie, défense 2, assistance à l’attaque, jumelé (ambidextrie)', { energie: '1 PE pour ignore armure' }),
  ]),
  w('epee-lumiere', 'Épée lumière', 'rare', 70, LDB_R, [
    p('1 main', 'contact', '6D6', '3D6', 'contact', 'orfèvrerie, lumière 6, anti-Anathème, assistance à l’attaque'),
    p('2 mains', 'contact', '6D6', '6D6', 'contact', 'lesté, lumière 6, anti-Anathème, assistance à l’attaque, deux mains'),
  ]),
  w('ceste-fracture', 'Ceste de fracture', 'rare', 80, LDB_R, [
    p('Contact', 'contact', '6D6', '3D6', 'contact', 'défense 2, ignore armure, anti-véhicule, destructeur, choc 2, jumelé (akimbo)', { energie: '1 PE par attaque' }),
  ]),
  w('masse-magnetique', 'Masse magnétique', 'rare', 90, LDB_R, [
    p('Contact', 'contact', '8D6', '6D6', 'contact', 'ignore CdF, choc 2, dispersion 3, lesté, lumière 2, lourd, deux mains'),
  ]),
  w('epee-sonique', 'Épée sonique', 'rare', 100, LDB_R, [
    p('Contact', 'contact', '4D6', '4D6', 'contact', 'ignore armure, anti-véhicule, fureur, lourd, deux mains, assistance à l’attaque',
      { energie: '1 PE par attaque ; +1D6 dégâts ou violence par PE (14D6 max au total)' }),
  ]),

  // 2038
  w('fusil-sonique', 'Fusil sonique', 'avance', 30, T38, [p('Tir', 'distance', '4D6', '4D6', 'courte', 'oblitération, choc 1, dispersion 3, deux mains')]),
  w('lance-lumiere', 'Lance de lumière', 'avance', 60, T38, [
    p('Contact', 'contact', '8D6', '4D6', 'contact', 'lumière 6, anti-Anathème, ténébricide, orfèvrerie, deux mains'),
  ]),
  w('canon-uv', 'Canon UV', 'rare', 80, T38, [p('Tir', 'distance', '10D6+10', '6D6', 'moyenne', 'lumière 6, anti-Anathème, ténébricide, deux mains, lourd')]),
  w('ceste-concussion', 'Ceste à concussion', 'avance', 40, T38, [p('Contact', 'contact', '6D6', '3D6', 'contact', 'oblitération, choc 1')]),
  w('fusil-uv', 'Fusil UV', 'avance', 40, T38, [p('Tir', 'distance', '6D6+5', '4D6', 'courte', 'lumière 2, anti-Anathème, ténébricide, deux mains')]),
  w('canon-concussion', 'Canon à concussion', 'rare', 60, T38, [p('Tir', 'distance', '7D6', '7D6', 'moyenne', 'oblitération, choc 1, dispersion 6, deux mains, lourd')]),
  w('la-joyeuse', 'La Joyeuse (relique)', 'rare', 40, '2038 p. 26', [
    p('Contact', 'contact', '6D6', '4D6', 'contact', 'lumière 4, anti-Anathème, ténébricide, espérance'),
  ], 'Relique d’espoir : −1 à toutes les pertes d’espoir du porteur.'),
  w('tonbogiri', 'Tonbogiri (relique)', 'rare', 60, '2038 p. 26', [
    p('Contact', 'contact', '8D6', '2D6', 'contact', 'lumière 2, anti-Anathème, ténébricide, ignore armure, espérance'),
  ]),

  // Codex 4
  w('pistolet-connecte', 'Pistolet connecté', 'standard', 20, C4, [p('Tir', 'distance', '2D6+6', '1D6', 'moyenne', 'assistance à l’attaque, jumelé (akimbo)')]),
  w('pistolet-precision', 'Pistolet de précision', 'standard', 20, C4, [p('Tir', 'distance', '2D6+6', '1D6', 'moyenne', 'précision, désignation')]),
  w('hache-combat', 'Hache de combat', 'standard', 30, C4, [p('Contact', 'contact', '4D6', '3D6+3', 'contact', 'lourd, lesté, ultraviolence')]),
  w('lance-perforante', 'Lance perforante à piston', 'standard', 30, C4, [p('Contact', 'contact', '5D6', '1D6', 'contact', 'perce armure 20, défense 2, deux mains')]),
  w('shotgun-automatique-leger', 'Shotgun automatique léger', 'avance', 50, C4, [
    p('Tir', 'distance', '3D6+10', '5D6+10', 'moyenne', 'meurtrier, dispersion 3, ultraviolence, barrage 2, jumelé (akimbo)'),
  ]),
  w('baton-combat', 'Bâton de combat', 'avance', 30, C4, [p('Contact', 'contact', '3D6', '1D6', 'contact', 'orfèvrerie, choc 1, cadence 2, deux mains')]),
  w('cimeterre-cinetique', 'Cimeterre cinétique', 'avance', 40, C4, [
    p('Contact', 'contact', '3D6', '1D6', 'contact', 'orfèvrerie, assassin 2, perce armure 30, deux mains'),
  ]),
  w('ceste-shotgun', 'Ceste shotgun', 'avance', 50, C4, [
    p('Contact', 'contact', '4D6', '2D6', 'contact', 'meurtrier, lesté, choc 1, jumelé (akimbo)'),
    p('Tir', 'distance', '2D6+10', '2D6', 'moyenne', 'meurtrier, choc 1, barrage 2'),
  ]),
  w('trident-machoire', 'Trident mâchoire', 'avance', 50, C4, [
    p('Contact', 'contact', '6D6', '4D6', 'contact', 'meurtrier, orfèvrerie, soumission, défense 2, deux mains'),
  ]),
  w('pistolets-ouragan', 'Paire de pistolets ouragan', 'rare', 70, C4, [
    p('Tir', 'distance', '5D6', '6D6', 'moyenne', 'fureur, cadence 3, tir en rafale, deux mains',
      { energie: '+1D6 par PE (dégâts 8D6, violence 10D6 max)' }),
  ]),
  w('stylet-thermique', 'Stylet thermique', 'rare', 65, C4, [
    p('Contact', 'contact', '2D6', '0', 'contact', 'ignore armure, ignore CdF, assassin 2, orfèvrerie, dégâts continus 6, lumière 4'),
  ]),
  w('lance-thermique', 'Lance thermique', 'rare', 90, C4, [
    p('Contact', 'contact', '7D6', '4D6', 'contact', 'soumission, orfèvrerie, dégâts continus 6, lumière 4, anti-Anathème, deux mains'),
  ]),
  w('chaine-tronconneuse', 'Chaîne tronçonneuse', 'rare', 100, C4, [
    p('Contact (portée courte)', 'contact', '6D6', '6D6', 'courte', 'destructeur, fureur, orfèvrerie, cadence 3, soumission, deux mains'),
  ]),
]

/** Profil « mains nues » (LdB p. 413) : 1D6 + Force en méta-armure, Force seule sans. */
export function unarmedProfile(armored: boolean): WeaponProfile {
  return p('Mains nues', 'contact', armored ? '1D6' : '0', '1', 'contact', '')
}

export function findWeapon(id: string): WeaponDef | undefined {
  return WEAPONS.find((x) => x.id === id)
}

const LDB_AM = 'LdB p. 428-429'
const C5 = 'Codex 5 p. 4-5'

export const WEAPON_UPGRADES: readonly WeaponUpgradeDef[] = [
  // Armes à distance (standards selon la FAQ 2020)
  { id: 'balles-grappes', nom: 'Balles grappes', pg: 10, pour: 'distance', effet: '+1D6 violence, −1D6 dégâts.', violence: 1, degats: -1, source: LDB_AM },
  { id: 'munitions-explosives', nom: 'Munitions explosives', pg: 10, pour: 'distance', effet: '+1D6 dégâts, −1D6 violence.', degats: 1, violence: -1, source: LDB_AM },
  { id: 'pointeur-laser', nom: 'Pointeur laser', pg: 10, pour: 'distance', effet: '+1 réussite automatique.', reussites: 1, source: LDB_AM },
  { id: 'lunette-intelligente', nom: 'Lunette intelligente', pg: 10, pour: 'distance', effet: '+1 cran de portée.', source: LDB_AM },
  { id: 'canon-raccourci', nom: 'Canon raccourci', pg: 10, pour: 'distance', effet: 'Dispersion 3 à portée courte ; difficulté +3 à moyenne et au-delà.', source: LDB_AM },
  { id: 'munitions-non-letales', nom: 'Munitions non létales', pg: 10, pour: 'distance', effet: 'Ne tue pas.', ajoute: 'non létal', source: LDB_AM },
  { id: 'canon-long', nom: 'Canon long', pg: 10, pour: 'distance', effet: '+1 réussite automatique à portée moyenne et au-delà ; difficulté +3 à portée courte.', source: LDB_AM },
  { id: 'munitions-iem', nom: 'Munitions IEM', pg: 15, pour: 'distance', effet: 'Parasitage 2, −1D6 dégâts et violence.', ajoute: 'parasitage 2', degats: -1, violence: -1, source: LDB_AM },
  { id: 'interface-guidage', nom: 'Interface de guidage', pg: 15, pour: 'distance', effet: 'Tir en sécurité.', ajoute: 'tir en sécurité', source: LDB_AM },
  { id: 'jumelage', nom: 'Jumelage', pg: 10, pour: 'distance', effet: 'Jumelé (akimbo ou ambidextrie), 10 PG par arme.', ajoute: 'jumelé (akimbo)', source: LDB_AM },
  { id: 'munitions-subsoniques', nom: 'Munitions subsoniques', pg: 20, pour: 'distance', effet: 'Silencieux.', ajoute: 'silencieux', source: LDB_AM },
  { id: 'protection-arme', nom: 'Protection d’arme', pg: 20, pour: 'distance', effet: '+2 en réaction.', ajoute: 'réaction 2', source: LDB_AM },
  { id: 'structure-alpha', nom: 'Structure alpha', pg: 20, pour: 'distance', effet: 'Indestructible.', ajoute: 'indestructible', source: LDB_AM },
  { id: 'revetement-omega', nom: 'Revêtement Omega', pg: 20, pour: 'distance', effet: 'Assassin 2 (armes silencieuses).', ajoute: 'assassin 2', source: LDB_AM },
  { id: 'chambre-double', nom: 'Chambre double', pg: 30, pour: 'distance', effet: 'Cadence 2 (ou +2D6 dégâts, codex 4) ; 2 emplacements.', ajoute: 'cadence 2', source: LDB_AM },
  { id: 'refroidissement', nom: 'Système de refroidissement', pg: 30, pour: 'distance', effet: 'Tir en rafale, barrage 1 ; l’arme gagne deux mains ou lourd.', ajoute: 'tir en rafale, barrage 1', source: LDB_AM },
  { id: 'hyper-velocite', nom: 'Munitions hyper vélocité', pg: 30, pour: 'distance', effet: 'Assistance à l’attaque ; l’arme gagne deux mains ou lourd.', ajoute: 'assistance à l’attaque', source: LDB_AM },
  { id: 'munitions-drones', nom: 'Munitions drones', pg: 30, pour: 'distance', effet: '+3 réussites automatiques.', reussites: 3, source: LDB_AM },
  // Forge : armes de contact (codex 5)
  { id: 'soeur', nom: 'Sœur', pg: 5, pour: 'contact', effet: 'Jumelé (ambidextrie).', ajoute: 'jumelé (ambidextrie)', source: C5 },
  { id: 'jumelle', nom: 'Jumelle', pg: 10, pour: 'contact', effet: 'Jumelé (akimbo) avec sa jumelle.', ajoute: 'jumelé (akimbo)', source: C5 },
  { id: 'electrifiee', nom: 'Électrifiée', pg: 5, pour: 'contact', effet: 'Choc 1.', ajoute: 'choc 1', source: C5 },
  { id: 'lumineuse', nom: 'Lumineuse', pg: 5, pour: 'contact', effet: 'Lumière 2.', ajoute: 'lumière 2', source: C5 },
  { id: 'agressive', nom: 'Agressive', pg: 5, pour: 'contact', effet: '+1D6 dégâts en style agressif.', source: C5 },
  { id: 'assassine', nom: 'Assassine', pg: 10, pour: 'contact', effet: 'Silencieux.', ajoute: 'silencieux', source: C5 },
  { id: 'allegee', nom: 'Allégée', pg: 10, pour: 'contact', effet: '−1D6 dégâts, perd deux mains.', degats: -1, source: C5 },
  { id: 'protectrice', nom: 'Protectrice', pg: 10, pour: 'contact', effet: 'Style défensif à −1 dé seulement.', source: C5 },
  { id: 'barbelee', nom: 'Barbelée', pg: 10, pour: 'contact', effet: 'Meurtrier.', ajoute: 'meurtrier', source: C5 },
  { id: 'sournoise', nom: 'Sournoise', pg: 10, pour: 'contact', effet: 'Orfèvrerie.', ajoute: 'orfèvrerie', source: C5 },
  { id: 'connectee', nom: 'Connectée', pg: 10, pour: 'contact', effet: 'Assistance à l’attaque.', ajoute: 'assistance à l’attaque', source: C5 },
  { id: 'massive', nom: 'Massive', pg: 10, pour: 'contact', effet: 'Lesté, mais −1 en défense.', ajoute: 'lesté', source: C5 },
  { id: 'indestructible', nom: 'Indestructible', pg: 15, pour: 'contact', effet: 'Indestructible.', ajoute: 'indestructible', source: C5 },
  { id: 'sur-mesure', nom: 'Sur mesure', pg: 20, pour: 'contact', effet: '+ Combat (OD compris) aux dégâts.', source: C5 },
]

export function findUpgrade(id: string): WeaponUpgradeDef | undefined {
  return WEAPON_UPGRADES.find((u) => u.id === id)
}
