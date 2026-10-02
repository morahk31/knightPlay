import type { RulesConfig } from '../rules/types'

/**
 * Règles par défaut, issues de `referentiel-regles/`.
 * Complétées au fil des phases ; surchargeables par l'écran « Règles » (phase 8).
 */
export const defaultRules: RulesConfig = {
  version: 1,
  creation: {
    // Fiche 02, étape 1 (LdB p. 111)
    aspectDepart: 2,
    caracDepart: 1,
  },
  limites: {
    // Fiche 02 (LdB p. 79)
    aspectMax: 9,
    // Fiche 02, lames du tarot (LdB p. 120)
    aspectCaps: [
      { inconvenient: 'Vétéran', aspect: 'all', max: 7 },
      { inconvenient: 'Brute', aspect: 'machine', max: 5 },
    ],
  },
  systeme: {
    // Fiche 05 (LdB p. 97)
    seuilDesespoir: 10,
    // Fiche 01 (LdB p. 76)
    difficultes: [
      { label: 'Facile', value: 1 },
      { label: 'Faisable', value: 2 },
      { label: 'Normal', value: 3 },
      { label: 'Délicat', value: 4 },
      { label: 'Ardu', value: 5 },
      { label: 'Difficile', value: 6 },
      { label: 'Complexe', value: 7 },
      { label: 'Très difficile', value: 9 },
      { label: 'Insurmontable', value: 12 },
      { label: 'Impossible', value: 15 },
    ],
    // Fiche 01 (LdB p. 78)
    exploitRelance: true,
    // Règle optionnelle, fiche 01 (LdB p. 77) : désactivée par défaut, au choix du MJ
    sacrificeDes: false,
    journalMax: 200,
  },
  armure: {
    // Fiche 06 (LdB p. 131-133)
    guardianPa: 5,
    guardianCdf: 5,
    rechargeParHeure: 6,
    heuresRepliPlein: 6,
    // Fiche 08 (LdB p. 412)
    nodDes: 3,
    nodsParMission: { energie: 3, armure: 3, soin: 3 },
    odSansEnergie: false,
    depassementSlots: false,
  },
  encaissement: {
    // ⚠️ LdB p. 413 : le reste va aux PS ; FAQ-2020 p. 6-7 : d'abord aux PA de la Guardian
    excedentApresPa: 'guardian',
    // Fiche 06 (LdB p. 131) : −1 PS par tranche complète de 5 PA perdus
    tranchePa: 5,
  },
  combat: {
    // Fiche 08 (LdB p. 413), FAQ-2020 p. 6
    bonusOdForce: 3,
    // ⚠️ Contradiction LdB p. 88 / p. 89 : le livret 2020 retient l'arrondi supérieur
    akimboArrondi: 'sup',
    // ⚠️ LdB : + réussites en trop ; livret 2020 : + autant de D6
    modeHeroique: 'des',
    pointFaibleArrondi: 'sup',
    rackMax: 5,
  },
  progression: {
    // Fiche 07 (LdB p. 107)
    pxFinMission: 5,
    pxObjectif: 5,
    pxPartieSup: 2,
    pxSecondaire: 1,
    pgObjectifMin: 10,
    pgObjectifMax: 20,
    pgSecondaire: 5,
    pgHeroique: 5,
    // Fiche 07 (LdB p. 108)
    coutAspect: 5,
    coutCarac: 2,
    // Fiche 09 (LdB p. 442) : au-delà du niveau 2, un OD compte comme rare
    coutOd: [10, 30, 50, 70, 100],
    odMax: 5,
    odNiveauRare: 3,
    paliers: { avance: 100, rare: 300, prestige: 500 },
    // LdB p. 91
    implant: 20,
    therapie: 100,
  },
  derivees: {
    // Fiche 02, étape 9 (LdB p. 173-174)
    santeBase: 10,
    santeParPoint: 6,
    espoirBase: 50,
    heroismeMax: 6,
    odDansDefenseReactionInitiative: true,
  },
}
