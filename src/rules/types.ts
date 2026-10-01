/**
 * Types du domaine KnightPlay.
 * Le personnage est complété au fil des phases (armure, armes, progression).
 */

/** Version du format des fichiers exportés et des données sauvegardées. */
export const DATA_VERSION = 1

export type AspectId = 'chair' | 'bete' | 'machine' | 'dame' | 'masque'

export type CaracId =
  | 'deplacement'
  | 'force'
  | 'endurance'
  | 'hargne'
  | 'combat'
  | 'instinct'
  | 'tir'
  | 'savoir'
  | 'technique'
  | 'aura'
  | 'parole'
  | 'sangFroid'
  | 'discretion'
  | 'dexterite'
  | 'perception'

/** Score d'une caractéristique et ses niveaux d'overdrive (méta-armure). */
export interface CaracValue {
  val: number
  od: number
}

export type GaugeId = 'sante' | 'armure' | 'energie' | 'espoir' | 'heroisme'

/**
 * Jauge : `actuel` fluctue en jeu. `total` n'est utilisé que pour les jauges
 * sans formule (armure, énergie, jusqu'à la phase 4). Santé, espoir et héroïsme
 * tirent leur total des valeurs dérivées.
 */
export interface Gauge {
  actuel: number
  total: number
}

/** Valeurs dérivées (référentiel, fiche 02, étape 9). */
export type DerivedId = 'defense' | 'reaction' | 'initiative' | 'santeMax' | 'contactsMax' | 'espoirMax'

/** Valeurs dérivées calculées à partir d'une caractéristique choisie. */
export type SourcedDerivedId = 'defense' | 'reaction' | 'initiative' | 'santeMax' | 'contactsMax'

/** Caractéristique source d'une valeur dérivée : `auto` = la meilleure de l'aspect. */
export type DerivedSource = CaracId | 'auto'

export interface Identity {
  surnom: string
  archetype: string
  hautFait: string
  blason: string
  voeu: string
  section: string
  age: string
  description: string
}

export interface Motivations {
  majeure: string
  mineures: string[]
}

/** Personnage joueur. */
export interface Character {
  id: string
  nom: string
  /** Date ISO de création. */
  createdAt: string
  /** Date ISO de dernière modification. */
  updatedAt: string
  identite: Identity
  motivations: Motivations
  /** Libellés libres ou issus des lames du tarot / sections. */
  avantages: string[]
  inconvenients: string[]
  aspects: Record<AspectId, number>
  caracs: Record<CaracId, CaracValue>
  jauges: Record<GaugeId, Gauge>
  derivedSource: Record<SourcedDerivedId, DerivedSource>
  /** Valeurs dérivées imposées manuellement (règle maison, cas particulier). */
  overrides: Partial<Record<DerivedId, number>>
  /** Bonus permanents aux totaux (ex. Dur à cuir +5 PS, Forteresse spirituelle +5 espoir). */
  bonus: { sante: number; espoir: number }
}

/** Contenu d'un fichier d'export `*.knightplay.json`. */
export interface CharacterFile {
  format: 'knightplay-character'
  version: number
  exportedAt: string
  character: Character
}

/** Plafond d'aspect imposé par un inconvénient (ex. Vétéran, Brute). */
export interface AspectCap {
  /** Libellé de l'inconvénient tel qu'il apparaît sur la fiche. */
  inconvenient: string
  /** Aspect concerné, ou `all` pour tous les aspects. */
  aspect: AspectId | 'all'
  max: number
}

/**
 * Paramètres de règles (valeurs par défaut issues du référentiel, surchargeables).
 * Convention : toute fonction de `src/rules/` reçoit cette configuration en
 * paramètre et n'importe jamais `defaultRules` directement.
 */
export interface RulesConfig {
  version: number
  creation: {
    /** Score de départ de chaque aspect. */
    aspectDepart: number
    /** Score de départ de chaque caractéristique. */
    caracDepart: number
  }
  limites: {
    /** Score d'aspect maximal d'un PJ. */
    aspectMax: number
    /** Plafonds imposés par certains inconvénients. */
    aspectCaps: AspectCap[]
  }
  derivees: {
    /** PS = santeBase + santeParPoint × caractéristique de Chair. */
    santeBase: number
    santeParPoint: number
    /** Total d'espoir de base. */
    espoirBase: number
    /** Points d'héroïsme maximum. */
    heroismeMax: number
    /** Les OD s'ajoutent-ils à la défense, la réaction et l'initiative ? */
    odDansDefenseReactionInitiative: boolean
  }
}
