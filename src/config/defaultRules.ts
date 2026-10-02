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
    // ⚠️ LdB : 2 PE ; FAQ-2020 : 1 PE (la FAQ est prioritaire)
    borealisPlasmaPe: 1,
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
    // ⚠️ FAQ-2020 p. 20 : 5 / 7 / 12 ; LdB p. 420 : 7 / 9 / 12
    casserArme: { standard: 5, avance: 7, rare: 12 },
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

// --- Métadonnées des paramètres (écran « Règles », phase 8) ---

export type RuleTheme = 'systeme' | 'personnage' | 'combat' | 'encaisser' | 'energie' | 'progression'

export const RULE_THEMES: { id: RuleTheme; label: string }[] = [
  { id: 'systeme', label: 'Système' },
  { id: 'personnage', label: 'Personnage' },
  { id: 'combat', label: 'Combat' },
  { id: 'encaisser', label: 'Encaisser' },
  { id: 'energie', label: 'Énergie et armure' },
  { id: 'progression', label: 'Progression' },
]

export type RuleMeta = {
  /** Chemin dans `RulesConfig`, ex. `progression.coutCarac`. */
  path: string
  label: string
  theme: RuleTheme
  /** Fiche du référentiel et page du livre. */
  source: string
  /** Point contesté du référentiel (variantes mises en avant). */
  conteste?: boolean
  aide?: string
} & (
  | { type: 'int'; min: number; max: number }
  | { type: 'bool' }
  | { type: 'enum'; options: { value: string; label: string }[] }
  | { type: 'intList'; length: number; min: number; max: number }
)

const int = (min: number, max: number) => ({ type: 'int' as const, min, max })

export const RULES_META: readonly RuleMeta[] = [
  // Points contestés
  { path: 'encaissement.excedentApresPa', label: 'Excédent quand les PA tombent à 0', theme: 'encaisser', conteste: true,
    source: 'Fiche 06 · LdB p. 413 / FAQ-2020 p. 6-7', type: 'enum',
    options: [{ value: 'guardian', label: 'PA de la Guardian, puis PS (FAQ 2020)' }, { value: 'ps', label: 'Directement aux PS (LdB p. 413)' }] },
  { path: 'combat.akimboArrondi', label: 'Akimbo : moitié de la violence de la 2ᵉ arme', theme: 'combat', conteste: true,
    source: 'Fiche 03 · LdB p. 88 / p. 89', type: 'enum',
    options: [{ value: 'sup', label: 'Arrondie au supérieur (LdB p. 89, livret)' }, { value: 'inf', label: 'Arrondie à l’inférieur (LdB p. 88)' }] },
  { path: 'armure.borealisPlasmaPe', label: 'Borealis : coût de l’attaque de plasma (PE)', theme: 'energie', conteste: true,
    source: 'Fiche 06 · LdB : 2 PE / FAQ-2020 : 1 PE', aide: 'Appliqué quand on choisit l’armure.', ...int(0, 10) },
  { path: 'combat.casserArme.standard', label: 'Casser une arme standard (difficulté)', theme: 'combat', conteste: true,
    source: 'Fiche 08 · FAQ-2020 p. 20 : 5 / LdB p. 420 : 7', ...int(0, 20) },
  { path: 'combat.casserArme.avance', label: 'Casser une arme avancée (difficulté)', theme: 'combat', conteste: true,
    source: 'Fiche 08 · FAQ-2020 p. 20 : 7 / LdB p. 420 : 9', ...int(0, 20) },
  { path: 'combat.casserArme.rare', label: 'Casser une arme rare (difficulté)', theme: 'combat', conteste: true,
    source: 'Fiche 08 · FAQ-2020 et LdB : 12', ...int(0, 20) },
  { path: 'combat.modeHeroique', label: 'Mode héroïque : réussites en trop', theme: 'combat', conteste: true,
    source: 'Fiche 05 · LdB p. 100 / livret 2020 p. 17', type: 'enum',
    options: [{ value: 'des', label: 'Autant de D6 (livret 2020)' }, { value: 'points', label: 'Autant de points (LdB)' }] },

  // Système
  { path: 'systeme.seuilDesespoir', label: 'Seuil de désespoir (−1 dé par point en dessous)', theme: 'systeme', source: 'Fiche 05 · LdB p. 98', ...int(0, 50) },
  { path: 'systeme.exploitRelance', label: 'Exploit : relance des dés (tous pairs)', theme: 'systeme', source: 'Fiche 01 · LdB p. 78', type: 'bool' },
  { path: 'systeme.sacrificeDes', label: 'Sacrifice de dés (2 dés = 1 réussite)', theme: 'systeme', source: 'Fiche 01 · LdB p. 77 (optionnel)', type: 'bool' },
  { path: 'systeme.journalMax', label: 'Entrées gardées dans le journal', theme: 'systeme', source: 'Outil', ...int(10, 2000) },

  // Personnage
  { path: 'creation.aspectDepart', label: 'Aspects au départ', theme: 'personnage', source: 'Fiche 02 · LdB p. 170', ...int(0, 9) },
  { path: 'creation.caracDepart', label: 'Caractéristiques au départ', theme: 'personnage', source: 'Fiche 02 · LdB p. 170', ...int(0, 9) },
  { path: 'limites.aspectMax', label: 'Aspect maximum d’un PJ', theme: 'personnage', source: 'Fiche 02 · LdB p. 79', ...int(1, 20) },
  { path: 'derivees.santeBase', label: 'PS de base', theme: 'personnage', source: 'Fiche 02 · LdB p. 173', ...int(0, 100) },
  { path: 'derivees.santeParPoint', label: 'PS par point de la caractéristique de Chair', theme: 'personnage', source: 'Fiche 02 · LdB p. 173', ...int(0, 20) },
  { path: 'derivees.espoirBase', label: 'Points d’espoir de base', theme: 'personnage', source: 'Fiche 02 · LdB p. 174', ...int(0, 200) },
  { path: 'derivees.heroismeMax', label: 'Points d’héroïsme maximum', theme: 'personnage', source: 'Fiche 05 · LdB p. 99', ...int(0, 20) },
  { path: 'derivees.odDansDefenseReactionInitiative', label: 'OD comptés dans défense, réaction et initiative', theme: 'personnage', source: 'Fiche 02 · LdB p. 174', type: 'bool' },

  // Combat
  { path: 'combat.bonusOdForce', label: 'Dégâts par OD de Force (contact)', theme: 'combat', source: 'Fiche 08 · LdB p. 413', ...int(0, 10) },
  { path: 'combat.pointFaibleArrondi', label: 'Point faible : arrondi de la moitié', theme: 'combat', source: 'Fiche 03 · LdB p. 104 (non précisé)', type: 'enum',
    options: [{ value: 'sup', label: 'Supérieur' }, { value: 'inf', label: 'Inférieur' }] },
  { path: 'combat.rackMax', label: 'Armes dans le rack', theme: 'combat', source: 'Fiche 06 · LdB p. 133', ...int(1, 20) },

  // Encaisser
  { path: 'encaissement.tranchePa', label: 'PA perdus par PS perdu (tranche)', theme: 'encaisser', source: 'Fiche 06 · LdB p. 131', ...int(0, 50),
    aide: '0 = pas de perte de PS par tranche.' },
  { path: 'armure.guardianPa', label: 'PA de la Guardian', theme: 'encaisser', source: 'Fiche 06 · LdB p. 133', ...int(0, 50) },
  { path: 'armure.guardianCdf', label: 'CdF de la Guardian', theme: 'encaisser', source: 'Fiche 06 · LdB p. 133', ...int(0, 50) },

  // Énergie
  { path: 'armure.rechargeParHeure', label: 'PE récupérés par heure de repos', theme: 'energie', source: 'Fiche 06 · LdB p. 131', ...int(0, 100) },
  { path: 'armure.heuresRepliPlein', label: 'Heures repliée pour une recharge complète', theme: 'energie', source: 'Fiche 06 · LdB p. 131', ...int(0, 48) },
  { path: 'armure.nodDes', label: 'D6 par nod', theme: 'energie', source: 'Fiche 08 · LdB p. 412', ...int(0, 10) },
  { path: 'armure.nodsParMission.energie', label: 'Nods d’énergie par mission', theme: 'energie', source: 'Fiche 08 · LdB p. 412', ...int(0, 20) },
  { path: 'armure.nodsParMission.armure', label: 'Nods d’armure par mission', theme: 'energie', source: 'Fiche 08 · LdB p. 412', ...int(0, 20) },
  { path: 'armure.nodsParMission.soin', label: 'Nods de soin par mission', theme: 'energie', source: 'Fiche 08 · LdB p. 412', ...int(0, 20) },
  { path: 'armure.odSansEnergie', label: 'OD actifs à 0 PE (règle maison)', theme: 'energie', source: 'Fiche 06 · LdB p. 131 (non)', type: 'bool' },
  { path: 'armure.depassementSlots', label: 'Autoriser le dépassement des slots', theme: 'energie', source: 'Fiche 06 · LdB p. 130 (non)', type: 'bool' },

  // Progression
  { path: 'progression.pxFinMission', label: 'PX de fin de mission', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 50) },
  { path: 'progression.pxObjectif', label: 'PX de l’objectif principal', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 50) },
  { path: 'progression.pxPartieSup', label: 'PX par partie supplémentaire', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 50) },
  { path: 'progression.pxSecondaire', label: 'PX par objectif secondaire', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 50) },
  { path: 'progression.pgObjectifMin', label: 'PG de l’objectif principal (minimum)', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 200) },
  { path: 'progression.pgObjectifMax', label: 'PG de l’objectif principal (maximum)', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 200) },
  { path: 'progression.pgSecondaire', label: 'PG par objectif secondaire', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 100) },
  { path: 'progression.pgHeroique', label: 'PG par mode héroïque', theme: 'progression', source: 'Fiche 07 · LdB p. 107', ...int(0, 100) },
  { path: 'progression.coutAspect', label: 'Coût d’un aspect (× nouveau score, en PX)', theme: 'progression', source: 'Fiche 07 · LdB p. 108', ...int(1, 50) },
  { path: 'progression.coutCarac', label: 'Coût d’une caractéristique (× nouveau score, en PX)', theme: 'progression', source: 'Fiche 07 · LdB p. 108', ...int(1, 50) },
  { path: 'progression.coutOd', label: 'Coût des niveaux d’OD 1 à 5 (PG)', theme: 'progression', source: 'Fiche 09 · LdB p. 442', type: 'intList', length: 5, min: 0, max: 1000 },
  { path: 'progression.odMax', label: 'Niveau d’OD maximum', theme: 'progression', source: 'Fiche 06 · LdB p. 130', ...int(1, 10) },
  { path: 'progression.odNiveauRare', label: 'Niveau d’OD à partir duquel il est rare', theme: 'progression', source: 'Fiche 09 · LdB p. 442', ...int(1, 10) },
  { path: 'progression.paliers.avance', label: 'PG gagnés pour l’équipement avancé', theme: 'progression', source: 'Fiche 07 · LdB p. 108', ...int(0, 5000) },
  { path: 'progression.paliers.rare', label: 'PG gagnés pour l’équipement rare', theme: 'progression', source: 'Fiche 07 · LdB p. 108', ...int(0, 5000) },
  { path: 'progression.paliers.prestige', label: 'PG gagnés pour le prestige', theme: 'progression', source: 'Fiche 07 · LdB p. 108', ...int(0, 5000) },
  { path: 'progression.implant', label: 'Prix d’un implant (PG)', theme: 'progression', source: 'Fiche 07 · LdB p. 91', ...int(0, 500) },
  { path: 'progression.therapie', label: 'Prix d’une thérapie de reconstruction (PG)', theme: 'progression', source: 'Fiche 07 · LdB p. 91', ...int(0, 500) },
]

/** Points du référentiel qui ne sont pas des paramètres : ils se corrigent dans les catalogues ou ne concernent pas l'outil. */
export const CONTESTED_INFO: readonly { titre: string; texte: string; source: string }[] = [
  { titre: 'Slots et OD de base des armures', source: 'README du référentiel, point 1 · LdB p. 135-167 ; 2038 p. 9-21',
    texte: 'Extraits de schémas : corrigez une armure dans Catalogues (« Copier pour corriger ») ou directement sur la fiche.' },
  { titre: 'Profils des véhicules', source: 'README du référentiel, point 2 · LdB p. 447-450',
    texte: 'L’ordre PA / PE / CdF est supposé. Les véhicules ne sont pas gérés par l’outil.' },
  { titre: 'Coûts illisibles', source: 'README du référentiel, point 7 · 2038, codex 1, cartes',
    texte: 'Modules de prestige, capacités héroïques, Shaman, Warlock et Berserk : ajoutez-les dans Catalogues avec vos valeurs.' },
]
