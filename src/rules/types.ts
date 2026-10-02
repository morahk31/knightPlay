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

export type LogOutcome = 'reussite' | 'echec' | 'critique' | 'exploit' | 'info'

/** Entrée du journal des jets et actions. */
export interface LogEntry {
  id: string
  /** Date ISO. */
  at: string
  kind: 'test' | 'info'
  title: string
  detail: string
  outcome: LogOutcome
}

/** Zones de slots d'une méta-armure. */
export type SlotZone = 'tete' | 'brasG' | 'brasD' | 'torse' | 'jambeG' | 'jambeD'

export type Slots = Record<SlotZone, number>

export type Disponibilite = 'standard' | 'avance' | 'rare' | 'prestige'

/** Capacité d'une méta-armure (mode Ghost, Shrine…). */
export interface ArmorCapability {
  id: string
  nom: string
  /** Coût en PE d'une activation standard (bouton « Activer »). `null` si variable ou nul. */
  cout: number | null
  /** Coût détaillé, tel qu'écrit dans le référentiel. */
  energie: string
  activation: string
  duree: string
  effet: string
}

export interface ArmorEvolution {
  /** Identifiant (évolutions utilisées par les calculs, ex. Longbow). */
  id?: string
  /** Évolution achetée (Ranger) : possédée. */
  possedee?: boolean
  /** Palier de PG totaux (ou coût en PG pour les évolutions achetées de la Ranger). */
  pg: number
  effet: string
  /** Vrai si l'évolution s'achète au lieu de se débloquer. */
  achetee?: boolean
}

/** Modèle de méta-armure du catalogue. */
export interface ArmorDef {
  id: string
  nom: string
  generation: number
  pa: number
  pe: number
  cdf: number
  /** OD fournis de base par l'armure. */
  od: Partial<Record<CaracId, number>>
  slots: Slots
  capacites: ArmorCapability[]
  evolutions: ArmorEvolution[]
  /** Valeurs extraites de tableaux graphiques : à vérifier dans les règles. */
  aVerifier: boolean
  source: string
  /** Particularités (4ᵉ génération, énergie déficiente…). */
  notes?: string
  /** Faux si l'armure ne récupère pas d'énergie au repos (Sorcerer). */
  rechargeRepos?: boolean
}

/** Niveau d'un module (1 = achat initial). */
export interface ModuleLevel {
  niveau: number
  pg: number
  dispo: Disponibilite
  effet: string
}

/** Bonus permanents d'un module (améliorations). Valeurs par niveau atteint. */
export interface ModulePermanent {
  pa?: number
  pe?: number
  cdf?: number
  /** Slots ajoutés à chaque zone. */
  slots?: number
}

/** Module du catalogue. */
export interface ModuleDef {
  id: string
  nom: string
  categorie: string
  slots: Partial<Slots>
  activation: string
  duree: string
  /** Coût en PE d'une activation (`null` = aucun ou variable). */
  energie: number | null
  energieTexte?: string
  effet: string
  niveaux: ModuleLevel[]
  /** Bonus permanents apportés par niveau (cumulés jusqu'au niveau installé). */
  permanent?: ModulePermanent
  source: string
}

/** Module installé sur l'armure d'un personnage (copie modifiable). */
export interface InstalledModule {
  uid: string
  /** Identifiant du catalogue, ou `null` pour un module personnalisé. */
  moduleId: string | null
  nom: string
  niveau: number
  slots: Partial<Slots>
  energie: number | null
  activation: string
  duree: string
  effet: string
  permanent?: ModulePermanent
}

/** Méta-armure portée par le personnage (valeurs préremplies depuis le catalogue, modifiables). */
export interface ArmorState {
  /** Identifiant du catalogue, `aucune` ou `personnalisee`. */
  modele: string
  nom: string
  generation: number
  pa: number
  pe: number
  cdf: number
  od: Partial<Record<CaracId, number>>
  slots: Slots
  capacites: ArmorCapability[]
  evolutions: ArmorEvolution[]
  aVerifier: boolean
  notes: string
  /** Faux si l'armure ne récupère pas d'énergie au repos (Sorcerer). */
  rechargeRepos: boolean
  /** Déployée ou repliée (la combinaison Guardian prend alors le relais). */
  etat: 'deployee' | 'repliee'
  /** PA actuels de la combinaison Guardian. */
  guardianPa: number
  /** Type actif de la Warrior (aspect), ou `null`. */
  warriorType: AspectId | null
  /** Types de la Warrior disponibles (3 à la création). */
  warriorTypes: AspectId[]
  /** Nods restants pour la mission en cours. */
  nods: { energie: number; armure: number; soin: number }
}

/** Points d'expérience et de gloire (historique en phase 7). */
export type TransactionKind = 'mission' | 'aspect' | 'carac' | 'od' | 'module' | 'arme' | 'legende' | 'evolution' | 'achat' | 'ajustement'

/** Données restaurées par l'annulation d'une transaction. */
export interface TransactionSnapshot {
  aspects: Record<AspectId, number>
  caracs: Record<CaracId, CaracValue>
  modules: InstalledModule[]
  armes: OwnedWeapon[]
  progression: Omit<ProgressionState, 'historique'>
  /** Évolutions de la méta-armure (achats d'évolutions de la Ranger). */
  evolutions?: ArmorEvolution[]
}

export interface Transaction {
  id: string
  /** Date ISO. */
  at: string
  kind: TransactionKind
  libelle: string
  /** Variations : PX actuels, PG disponibles, PG totaux gagnés. */
  px: number
  pg: number
  pgTotal: number
  /** Passage outre une règle (règle maison). */
  outrepasse?: boolean
  avant: TransactionSnapshot
}

export interface ProgressionState {
  pxActuel: number
  pxTotal: number
  /** PG disponibles pour les achats. */
  pgSolde: number
  /** PG gagnés depuis la création : ne baisse jamais (paliers, évolutions). */
  pgTotal: number
  /** Aspects augmentés depuis la dernière fin de mission (une seule fois chacun). */
  aspectsMission: AspectId[]
  /** Transactions, la plus récente en premier. */
  historique: Transaction[]
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
  /** Journal des jets et actions (le plus récent en premier). */
  journal: LogEntry[]
  armure: ArmorState
  modules: InstalledModule[]
  progression: ProgressionState
  armes: OwnedWeapon[]
  combat: CombatState
  /** Notes libres du joueur (session, campagne). */
  notes: string
}

// --- Armes et attaques (phase 5) ---

export type Portee = 'contact' | 'courte' | 'moyenne' | 'longue' | 'lointaine'

/** Jet de dés : XD6 + fixe. Les bonus de caractéristiques viennent du type d'attaque et des effets. */
export interface DiceExpr {
  des: number
  fixe: number
}

/** Effet d'arme : identifiant du catalogue (ou `autre`), niveau X éventuel, libellé affiché. */
export interface EffectRef {
  id: string
  x?: number
  label: string
}

export interface WeaponProfile {
  /** Libellé du profil (« contact », « tir », « 2 mains », « missiles »…). */
  nom: string
  type: 'contact' | 'distance'
  degats: DiceExpr
  violence: DiceExpr
  portee: Portee
  effets: EffectRef[]
  /** Coût en énergie (texte libre). */
  energie?: string
  /** Ajouter la Force aux dégâts (par défaut : vrai au contact, faux à distance). */
  force?: boolean
}

export interface WeaponDef {
  id: string
  nom: string
  categorie: 'contact' | 'distance'
  dispo: Disponibilite
  pg: number
  profils: WeaponProfile[]
  source: string
  notes?: string
}

export interface WeaponUpgradeDef {
  id: string
  nom: string
  pg: number
  pour: 'distance' | 'contact'
  effet: string
  /** Effets ajoutés au profil (syntaxe des effets, ex. « silencieux, choc 1 »). */
  ajoute?: string
  /** Dés de dégâts et de violence ajoutés (+) ou retirés (−). */
  degats?: number
  violence?: number
  /** Réussites automatiques à l'attaque. */
  reussites?: number
  source: string
}

/** Arsenal de légende : arme de base, châssis et optimisations achetées. */
export type LegendBase = 'pistolet' | 'lame' | 'longbow'

export interface LegendBonus {
  degatsDes?: number
  degatsFixe?: number
  violenceDes?: number
  violenceFixe?: number
}

export interface LegendOptimisation {
  /** Identifiant unique dans le châssis. */
  id: string
  nom: string
  rarete: Disponibilite
  /** Coût de chaque achat successif (plusieurs coûts = achat répétable). */
  couts: number[]
  /** Bonus apportés par chaque achat. */
  bonus?: LegendBonus
  /** Effets ajoutés (notation des profils). */
  effet?: string
  /** Effet remplacé (« remplace X ») : identifiant de l'effet retiré. */
  remplace?: string
  /** Effets supprimés (ex. deux mains, lourd). */
  retire?: string[]
  portee?: Portee
  /** Règle particulière (Longbow). */
  texte?: string
  /** Voisins dans l'arbre : identifiants d'optimisations, `racine` (relié au châssis) ou `bus:…` (ligne commune). */
  liens: string[]
}

export interface LegendChassis {
  id: string
  nom: string
  base: LegendBase
  pg: number
  description: string
  profil: WeaponProfile
  optimisations: LegendOptimisation[]
  source: string
}

export interface LegendState {
  base: LegendBase
  chassisId: string | null
  /** Nombre d'achats par optimisation. */
  achats: Record<string, number>
}

/** Arme du rack d'un personnage (copie modifiable). */
export interface OwnedWeapon {
  uid: string
  weaponId: string | null
  nom: string
  profils: WeaponProfile[]
  /** Identifiants d'améliorations du catalogue. */
  ameliorations: string[]
  notes: string
  /** Arme de l'arsenal de légende (pistolet, lame ou Longbow). */
  legende?: LegendState
}

export type StyleId =
  | 'standard'
  | 'agressif'
  | 'defensif'
  | 'couvert'
  | 'ambidextre'
  | 'akimbo'
  | 'precis'
  | 'pilonnage'
  | 'puissant'
  | 'suppression'

export interface CombatState {
  style: StyleId
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

/** Niveau de difficulté nommé (fiche 01). */
export interface DifficultyLevel {
  label: string
  value: number
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
  systeme: {
    /** Sous ce nombre de points d'espoir, −1 dé par point manquant (fiche 05). */
    seuilDesespoir: number
    /** Niveaux de difficulté nommés (fiche 01). */
    difficultes: DifficultyLevel[]
    /** Relance d'exploit quand tous les dés sont pairs (fiche 01). */
    exploitRelance: boolean
    /** Règle optionnelle : sacrifier des dés par paires contre des réussites automatiques. */
    sacrificeDes: boolean
    /** Nombre maximal d'entrées conservées dans le journal. */
    journalMax: number
  }
  armure: {
    /** Combinaison Guardian (fiche 06). */
    guardianPa: number
    guardianCdf: number
    /** PE récupérés par heure de repos. */
    rechargeParHeure: number
    /** Heures repliée pour une recharge complète. */
    heuresRepliPlein: number
    /** Nombre de D6 d'un nod (soin, armure, énergie). */
    nodDes: number
    /** Nods reçus au début de chaque mission. */
    nodsParMission: { energie: number; armure: number; soin: number }
    /** Les OD restent-ils actifs à 0 PE ? (LdB : non) */
    odSansEnergie: boolean
    /** Coût de l'attaque de plasma de Borealis : 2 PE (LdB) ou 1 PE (FAQ 2020). */
    borealisPlasmaPe: number
    /** Autoriser l'installation au-delà des slots disponibles (règle maison). */
    depassementSlots: boolean
  }
  encaissement: {
    /** Dégâts restants quand les PA tombent à 0 : Guardian puis PS (FAQ 2020) ou directement PS (LdB p. 413). */
    excedentApresPa: 'guardian' | 'ps'
    /** Taille d'une tranche de PA perdus qui coûte 1 PS (fiche 06). */
    tranchePa: number
  }
  combat: {
    /** Dégâts par OD de Force au contact (fiche 08). */
    bonusOdForce: number
    /** Arrondi de la moitié de violence en akimbo (contradiction du LdB p. 88-89). */
    akimboArrondi: 'sup' | 'inf'
    /** Réussites en trop du mode héroïque : en points (LdB) ou en D6 (livret 2020). */
    modeHeroique: 'points' | 'des'
    /** Arrondi de la défense ou réaction divisée par le point faible. */
    pointFaibleArrondi: 'sup' | 'inf'
    /** Nombre d'armes dans le rack. */
    rackMax: number
    /** Difficulté pour casser une arme (base Force) : 5/7/12 (FAQ 2020) ou 7/9/12 (LdB p. 420). */
    casserArme: { standard: number; avance: number; rare: number }
  }
  progression: {
    pxFinMission: number
    pxObjectif: number
    pxPartieSup: number
    pxSecondaire: number
    pgObjectifMin: number
    pgObjectifMax: number
    pgSecondaire: number
    pgHeroique: number
    /** Coût d'un aspect = nouveau score × coutAspect. */
    coutAspect: number
    /** Coût d'une caractéristique = nouveau score × coutCarac. */
    coutCarac: number
    /** Coût de chaque niveau d'OD (niveau 1 à 5). */
    coutOd: number[]
    odMax: number
    /** Niveau d'OD à partir duquel il compte comme rare. */
    odNiveauRare: number
    /** PG totaux requis par disponibilité. */
    paliers: { avance: number; rare: number; prestige: number }
    implant: number
    therapie: number
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
