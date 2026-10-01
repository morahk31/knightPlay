import type {
  ArmorState,
  AspectId,
  CaracId,
  CaracValue,
  Character,
  GaugeId,
  RulesConfig,
  Slots,
  SourcedDerivedId,
} from './types'

export interface AspectDef {
  id: AspectId
  nom: string
  caracs: readonly [CaracId, CaracId, CaracId]
}

/** Les 5 aspects et leurs 3 caractéristiques (référentiel, fiche 02). */
export const ASPECTS: readonly AspectDef[] = [
  { id: 'chair', nom: 'Chair', caracs: ['deplacement', 'force', 'endurance'] },
  { id: 'bete', nom: 'Bête', caracs: ['hargne', 'combat', 'instinct'] },
  { id: 'machine', nom: 'Machine', caracs: ['tir', 'savoir', 'technique'] },
  { id: 'dame', nom: 'Dame', caracs: ['aura', 'parole', 'sangFroid'] },
  { id: 'masque', nom: 'Masque', caracs: ['discretion', 'dexterite', 'perception'] },
]

export const CARAC_LABELS: Record<CaracId, string> = {
  deplacement: 'Déplacement',
  force: 'Force',
  endurance: 'Endurance',
  hargne: 'Hargne',
  combat: 'Combat',
  instinct: 'Instinct',
  tir: 'Tir',
  savoir: 'Savoir',
  technique: 'Technique',
  aura: 'Aura',
  parole: 'Parole',
  sangFroid: 'Sang-froid',
  discretion: 'Discrétion',
  dexterite: 'Dextérité',
  perception: 'Perception',
}

export const CARAC_IDS = ASPECTS.flatMap((a) => a.caracs)

export const GAUGE_LABELS: Record<GaugeId, string> = {
  sante: 'Santé',
  armure: 'Armure',
  energie: 'Énergie',
  espoir: 'Espoir',
  heroisme: 'Héroïsme',
}

export const GAUGE_IDS: readonly GaugeId[] = ['sante', 'armure', 'energie', 'espoir', 'heroisme']

/** Aspect dont dépend chaque valeur dérivée à caractéristique source. */
export const DERIVED_ASPECT: Record<SourcedDerivedId, AspectId> = {
  defense: 'bete',
  reaction: 'machine',
  initiative: 'masque',
  santeMax: 'chair',
  contactsMax: 'dame',
}

export function aspectOf(carac: CaracId): AspectId {
  const aspect = ASPECTS.find((a) => a.caracs.includes(carac))
  if (!aspect) throw new Error(`Caractéristique inconnue : ${carac}`)
  return aspect.id
}

/** Valeur de `armure.modele` quand aucune méta-armure n'est choisie. */
export const NO_ARMOR = 'aucune'

export function emptySlots(): Slots {
  return { tete: 0, brasG: 0, brasD: 0, torse: 0, jambeG: 0, jambeD: 0 }
}

/** État « sans méta-armure » : les totaux d'armure et d'énergie se saisissent à la main. */
export function noArmor(rules: RulesConfig): ArmorState {
  return {
    modele: NO_ARMOR,
    nom: '',
    generation: 0,
    pa: 0,
    pe: 0,
    cdf: 0,
    od: {},
    slots: emptySlots(),
    capacites: [],
    evolutions: [],
    aVerifier: false,
    notes: '',
    rechargeRepos: true,
    etat: 'deployee',
    guardianPa: rules.armure.guardianPa,
    warriorType: null,
    warriorTypes: [],
    nods: { ...rules.armure.nodsParMission },
  }
}

/** Données de fiche d'un nouveau chevalier (étape 1 de la création). */
export function blankSheet(rules: RulesConfig): Omit<Character, 'id' | 'nom' | 'createdAt' | 'updatedAt'> {
  const aspects = Object.fromEntries(
    ASPECTS.map((a) => [a.id, rules.creation.aspectDepart]),
  ) as Record<AspectId, number>
  const caracs = Object.fromEntries(
    CARAC_IDS.map((c) => [c, { val: rules.creation.caracDepart, od: 0 }]),
  ) as Record<CaracId, CaracValue>
  const santeDepart =
    rules.derivees.santeBase + rules.derivees.santeParPoint * rules.creation.caracDepart
  return {
    identite: {
      surnom: '',
      archetype: '',
      hautFait: '',
      blason: '',
      voeu: '',
      section: '',
      age: '',
      description: '',
    },
    motivations: { majeure: '', mineures: [] },
    avantages: [],
    inconvenients: [],
    aspects,
    caracs,
    jauges: {
      sante: { actuel: santeDepart, total: santeDepart },
      armure: { actuel: 0, total: 0 },
      energie: { actuel: 0, total: 0 },
      espoir: { actuel: rules.derivees.espoirBase, total: rules.derivees.espoirBase },
      heroisme: { actuel: 0, total: rules.derivees.heroismeMax },
    },
    derivedSource: {
      defense: 'auto',
      reaction: 'auto',
      initiative: 'auto',
      santeMax: 'auto',
      contactsMax: 'auto',
    },
    overrides: {},
    bonus: { sante: 0, espoir: 0 },
    journal: [],
    armure: noArmor(rules),
    modules: [],
    progression: { pxActuel: 0, pxTotal: 0, pgSolde: 0, pgTotal: 0 },
    armes: [],
    combat: { style: 'standard' },
  }
}
