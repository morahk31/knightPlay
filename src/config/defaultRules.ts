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
  derivees: {
    // Fiche 02, étape 9 (LdB p. 173-174)
    santeBase: 10,
    santeParPoint: 6,
    espoirBase: 50,
    heroismeMax: 6,
    odDansDefenseReactionInitiative: true,
  },
}
