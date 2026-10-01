/**
 * Types du domaine KnightPlay.
 * Le personnage est complété au fil des phases (fiche, armure, armes, progression).
 */

/** Version du format des fichiers exportés et des données sauvegardées. */
export const DATA_VERSION = 1

/** Personnage joueur (squelette, enrichi par les phases suivantes). */
export interface Character {
  id: string
  nom: string
  /** Date ISO de création. */
  createdAt: string
  /** Date ISO de dernière modification. */
  updatedAt: string
}

/** Contenu d'un fichier d'export `*.knightplay.json`. */
export interface CharacterFile {
  format: 'knightplay-character'
  version: number
  exportedAt: string
  character: Character
}

/**
 * Paramètres de règles (valeurs par défaut issues du référentiel, surchargeables).
 * Convention : toute fonction de `src/rules/` reçoit cette configuration en
 * paramètre et n'importe jamais `defaultRules` directement.
 */
export interface RulesConfig {
  version: number
}
