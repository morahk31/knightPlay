import type { AspectId, CaracId } from '../rules/types'

/**
 * Choix de création préremplis (référentiel, fiche 02 ; blasons Faucon et Cheval : codex 1).
 * Les effets sont des rappels textuels : aucun bonus n'est appliqué automatiquement,
 * le joueur reporte lui-même les points sur sa fiche.
 */

export interface Archetype {
  nom: string
  /** Caractéristiques gagnant +1 ; un tableau imbriqué signifie « au choix ». */
  bonus: (CaracId | CaracId[])[]
}

export const ARCHETYPES: readonly Archetype[] = [
  { nom: 'Rebut', bonus: ['deplacement', 'endurance'] },
  { nom: 'Citoyen', bonus: ['technique', 'discretion'] },
  { nom: 'Habitant des territoires libres', bonus: ['savoir', 'parole'] },
  { nom: 'Célébrité', bonus: ['aura', 'parole'] },
  { nom: 'Survivant', bonus: ['endurance', 'hargne'] },
  { nom: 'Membre d’une société secrète', bonus: ['savoir', ['combat', 'tir']] },
  { nom: 'Agent du Nodachi', bonus: [['combat', 'tir'], 'dexterite'] },
  { nom: 'Membre d’un service secret', bonus: [['combat', 'tir'], 'discretion'] },
  { nom: 'Génie', bonus: ['savoir', 'technique'] },
  { nom: 'Artiste', bonus: ['hargne', 'aura'] },
  { nom: 'Indépendant', bonus: ['perception', 'instinct'] },
  { nom: 'Religieux', bonus: ['sangFroid', 'hargne'] },
  { nom: 'Leader', bonus: ['aura', 'instinct'] },
  { nom: 'Hors-la-loi', bonus: ['sangFroid', 'discretion'] },
  { nom: 'Voyageur', bonus: ['deplacement', 'perception'] },
  { nom: 'Combattant', bonus: ['combat', 'tir'] },
  { nom: 'Force de la nature', bonus: ['force', 'endurance'] },
]

export interface Trait {
  nom: string
  effet: string
}

export interface Lame {
  numero: string
  nom: string
  /** Aspect gagnant +1 (et 3 points dans ses caractéristiques), ou bonus spécial. */
  bonus: AspectId | 'special'
  bonusTexte: string
  avantage: Trait
  inconvenient: Trait
}

const std = (aspect: string) => `+1 ${aspect} et 3 points dans ses caractéristiques`

export const LAMES: readonly Lame[] = [
  { numero: 'I', nom: 'Le Bateleur', bonus: 'dame', bonusTexte: std('Dame'),
    avantage: { nom: 'Infatigable', effet: 'Pas de perte de PS due aux dégâts encaissés par les PA.' },
    inconvenient: { nom: 'Colérique', effet: '−3 dés aux tests de Sang-froid pour se calmer.' } },
  { numero: 'II', nom: 'La Papesse', bonus: 'masque', bonusTexte: std('Masque'),
    avantage: { nom: 'Connaissance secrète', effet: 'Difficulté −1 niveau en Savoir sur un domaine choisi.' },
    inconvenient: { nom: 'Curiosité maladive', effet: 'Une fois par séance, le MJ impose un centre d’intérêt.' } },
  { numero: 'III', nom: 'L’Impératrice', bonus: 'machine', bonusTexte: std('Machine'),
    avantage: { nom: 'Mémoire efficace', effet: 'Un savoir ou souvenir fourni par le MJ par séance.' },
    inconvenient: { nom: 'Esprit de contradiction', effet: 'Doit contester un argument une fois par partie.' } },
  { numero: 'IV', nom: 'L’Empereur', bonus: 'dame', bonusTexte: std('Dame'),
    avantage: { nom: 'Magnétique', effet: '+1 réussite automatique aux jets base Aura face aux humains.' },
    inconvenient: { nom: 'Présomptueux', effet: 'Roleplay : se vante, attaque des ennemis trop forts.' } },
  { numero: 'V', nom: 'Le Pape', bonus: 'machine', bonusTexte: std('Machine'),
    avantage: { nom: 'Forteresse spirituelle', effet: '+5 au total de points d’espoir.' },
    inconvenient: { nom: 'Fanatique', effet: 'Roleplay uniquement.' } },
  { numero: 'VI', nom: 'L’Amoureux', bonus: 'bete', bonusTexte: std('Bête'),
    avantage: { nom: 'Aisance', effet: 'Ignore l’effet lourd (deux mains toujours nécessaires).' },
    inconvenient: { nom: 'Graveleux', effet: 'Difficulté +1 en Parole et Aura face aux personnes qui l’attirent.' } },
  { numero: 'VII', nom: 'Le Chariot', bonus: 'bete', bonusTexte: std('Bête'),
    avantage: { nom: 'Sûr de soi', effet: '+1 réussite automatique aux jets base Parole face aux humains.' },
    inconvenient: { nom: 'Ennemi juré', effet: 'Un ennemi puissant le traque.' } },
  { numero: 'VIII', nom: 'La Justice', bonus: 'machine', bonusTexte: std('Machine'),
    avantage: { nom: 'Bon sens', effet: '+1 réussite automatique pour ne pas être berné, pas d’échec critique.' },
    inconvenient: { nom: 'Trop prudent', effet: 'Initiative en 2D6 au lieu de 3D6.' } },
  { numero: 'IX', nom: 'L’Ermite', bonus: 'machine', bonusTexte: std('Machine'),
    avantage: { nom: 'Esprit d’acier', effet: '−1 à chaque perte d’espoir.' },
    inconvenient: { nom: 'Solitaire', effet: 'Difficulté +1 aux tests d’entraide.' } },
  { numero: 'X', nom: 'La Roue-de-Fortune', bonus: 'bete', bonusTexte: std('Bête'),
    avantage: { nom: 'Chanceux', effet: 'Une relance gratuite d’un test raté par partie.' },
    inconvenient: { nom: 'Mauvaises intuitions', effet: 'Le MJ fait échouer un test Instinct ou Perception par partie.' } },
  { numero: 'XI', nom: 'La Force', bonus: 'chair', bonusTexte: std('Chair'),
    avantage: { nom: 'Dur à cuir', effet: '+5 au total de points de santé.' },
    inconvenient: { nom: 'Forcené', effet: 'Le MJ peut imposer une attaque une fois par partie.' } },
  { numero: 'XII', nom: 'Le Pendu', bonus: 'chair', bonusTexte: std('Chair'),
    avantage: { nom: 'Code moral', effet: '+1 motivation mineure « respect du code ».' },
    inconvenient: { nom: 'Sacrifice total', effet: 'Pas de motivation majeure.' } },
  { numero: 'XIII', nom: 'L’Arcane sans nom', bonus: 'masque', bonusTexte: std('Masque'),
    avantage: { nom: 'Trompe la mort', effet: 'Ignore le résultat « mort » des blessures, une fois par mission.' },
    inconvenient: { nom: 'Vétéran', effet: 'Aspects limités à 7.' } },
  { numero: 'XIV', nom: 'La Tempérance', bonus: 'chair', bonusTexte: std('Chair'),
    avantage: { nom: 'Guérison rapide', effet: 'Récupération ×2, +3 PS par soin.' },
    inconvenient: { nom: 'Immunité déficiente', effet: 'Poisons et maladies infligent leur maximum.' } },
  { numero: 'XV', nom: 'Le Diable', bonus: 'bete', bonusTexte: std('Bête'),
    avantage: { nom: 'Instinct animal', effet: '+10 initiative en embuscade, garde défense et réaction en cas de surprise.' },
    inconvenient: { nom: 'Brute', effet: 'Machine limitée à 5.' } },
  { numero: 'XVI', nom: 'La Maison-Dieu', bonus: 'special', bonusTexte: '2 points d’aspect à répartir (pas de points de caractéristique)',
    avantage: { nom: 'Soif d’apprendre', effet: 'Apprend d’un PJ (+2 au moins) à moitié prix en PX.' },
    inconvenient: { nom: 'Amnésique', effet: 'Passé et avantages définis en secret par le MJ.' } },
  { numero: 'XVII', nom: 'L’Étoile', bonus: 'masque', bonusTexte: std('Masque'),
    avantage: { nom: 'Rêves prémonitoires', effet: 'Une vision par partie.' },
    inconvenient: { nom: 'Cauchemars', effet: '1D6 au repos : impair = pas de récupération et −1 espoir.' } },
  { numero: 'XVIII', nom: 'La Lune', bonus: 'masque', bonusTexte: std('Masque'),
    avantage: { nom: 'Menteur professionnel', effet: 'Difficulté −1 en Parole combo Discrétion.' },
    inconvenient: { nom: 'Lunatique', effet: 'Le MJ décide de son humeur une fois par partie.' } },
  { numero: 'XIX', nom: 'Le Soleil', bonus: 'dame', bonusTexte: std('Dame'),
    avantage: { nom: 'Rayonnement', effet: 'Ses aidants gagnent +1 dé.' },
    inconvenient: { nom: 'Égoïste', effet: 'Jamais adjuvant en mode héroïque.' } },
  { numero: 'XX', nom: 'Le Jugement', bonus: 'dame', bonusTexte: std('Dame'),
    avantage: { nom: 'Empathie', effet: '+1 réussite automatique en Instinct pour lire les émotions, pas d’échec critique.' },
    inconvenient: { nom: 'Prisonnier', effet: 'Aucun gain d’espoir tant que la liberté n’est pas retrouvée.' } },
  { numero: 'XXI', nom: 'Le Monde', bonus: 'chair', bonusTexte: std('Chair'),
    avantage: { nom: 'Créateur-né', effet: '+1 motivation mineure « réaliser une œuvre ».' },
    inconvenient: { nom: 'Porte-malheur', effet: 'Le MJ transforme un échec en échec critique une fois par partie.' } },
  { numero: '0', nom: 'Le Fou', bonus: 'special', bonusTexte: '6 points de caractéristique libres (pas d’aspect)',
    avantage: { nom: 'Chevalier véritable', effet: 'Mode héroïque dès 4 points d’héroïsme.' },
    inconvenient: { nom: 'Trouble mental', effet: 'Phobie ou trouble compulsif.' } },
]

export interface HautFait {
  nom: string
  condition: string
  aspect: string
}

export const HAUTS_FAITS: readonly HautFait[] = [
  { nom: 'Survivant de la peste rouge', condition: 'Endurance 4 ou Hargne 4', aspect: 'Chair' },
  { nom: 'Torturé dans les ténèbres', condition: 'Endurance 4 ou Force 4', aspect: 'Chair' },
  { nom: 'Combat de titans', condition: 'Chair 4', aspect: 'Chair' },
  { nom: 'En territoire ennemi', condition: 'Bête 4', aspect: 'Bête' },
  { nom: 'Le renouveau de l’espoir', condition: 'Hargne 4 ou Sang-froid 4', aspect: 'Bête' },
  { nom: 'Héros de guerre', condition: 'Combat 4 ou Tir 4', aspect: 'Bête ou Machine' },
  { nom: 'Construction de la première arche', condition: 'Technique 4 ou Savoir 4', aspect: 'Machine' },
  { nom: 'Conception de la première méta-armure', condition: 'Technique 4', aspect: 'Machine' },
  { nom: 'Découverte d’une tache dissimulée', condition: 'Perception 4 ou Instinct 4', aspect: 'Masque' },
  { nom: 'Guide', condition: 'Parole 4 ou Perception 4', aspect: 'Dame' },
  { nom: 'Création du Knight', condition: 'Aura 4 ou Combat 4', aspect: 'Dame' },
  { nom: 'Tueur de ténèbres', condition: 'Discrétion 4 ou Perception 4', aspect: 'Masque' },
  { nom: 'Défenseur de l’art', condition: 'Hargne 4 ou Sang-froid 4', aspect: 'Bête ou Dame' },
  { nom: 'Sauveur', condition: 'Perception 4 ou Sang-froid 4', aspect: 'Masque ou Dame' },
]

export interface Blason {
  nom: string
  voeu: string
}

export const BLASONS: readonly Blason[] = [
  { nom: 'Corbeau', voeu: 'Participer à la résolution d’un crime, d’un enlèvement ou d’un meurtre.' },
  { nom: 'Taureau', voeu: 'Respecter, à chaque mission, le code d’honneur du Knight.' },
  { nom: 'Lion', voeu: 'Ne jamais fuir devant un ennemi s’il met des innocents en danger.' },
  { nom: 'Dragon', voeu: 'Respecter la loi locale et ne jamais mentir.' },
  { nom: 'Ours', voeu: 'Empêcher la mort d’un être humain.' },
  { nom: 'Cerf', voeu: 'Obéir à la lettre aux ordres des chevaliers et d’Arthur.' },
  { nom: 'Aigle', voeu: 'Faire respecter le code d’honneur du Knight lorsqu’il semble bafoué.' },
  { nom: 'Sanglier', voeu: 'Accomplir le ou les objectifs actuellement fixés, coûte que coûte.' },
  { nom: 'Serpent', voeu: 'Découvrir les secrets de l’Anathème.' },
  { nom: 'Loup', voeu: 'Protéger un chevalier alors qu’il est en danger.' },
  { nom: 'Faucon', voeu: 'Pourfendre, sans aide, un salopard ou un patron de l’Anathème.' },
  { nom: 'Cheval', voeu: 'Se montrer fidèle, loyal et protecteur envers une personne d’importance.' },
]

export interface Section {
  nom: string
  aspect: string
  modules: string
  inconvenient: Trait
}

export const SECTIONS: readonly Section[] = [
  { nom: 'Ogre', aspect: 'Bête', modules: 'Déplacement silencieux, vue alternative (prédatrice), fumigène',
    inconvenient: { nom: 'Marqué par les ténèbres', effet: '−2 dés en social hors coterie et section.' } },
  { nom: 'Dragon', aspect: 'Dame', modules: 'Pod fusées éclairantes, flash, attaque non létale nv1',
    inconvenient: { nom: 'Humaniste', effet: 'Perd 1D6+6 espoir (au lieu de 1D6) face à « désespérant ».' } },
  { nom: 'Giant', aspect: 'Machine', modules: '+1 OD de Technique',
    inconvenient: { nom: 'Rat d’atelier', effet: 'Subit l’échec critique de la capacité peur sans test.' } },
  { nom: 'Gargoyle', aspect: 'Chair', modules: 'Banner, relais TacCom',
    inconvenient: { nom: 'Surprotecteur', effet: 'Protégé : −1D6+3 espoir à son agonie, −2D6+6 à sa mort.' } },
  { nom: 'Korrigan', aspect: 'Masque', modules: 'Relais satellite nv1, drone d’espionnage, caméraman',
    inconvenient: { nom: 'Toujours un doute', effet: '−3 dés pour aider ; aucun regain d’espoir venant des alliés.' } },
  { nom: 'Tarasque', aspect: 'Bête', modules: 'Lame de bras nv1, attaque sur casque nv1, saut nv1',
    inconvenient: { nom: 'Fou dangereux', effet: 'Tué si moins de 10 espoir au début d’une scène.' } },
  { nom: 'Griffon', aspect: 'Masque', modules: 'Déploiement pour moto steed',
    inconvenient: { nom: 'Jouteur', effet: '−2 dés en combat et au tir à pied.' } },
  { nom: 'Cyclope', aspect: 'Machine', modules: '+1 OD de Savoir',
    inconvenient: { nom: 'Sensible à l’Anathème', effet: '+1D6 face à la capacité Anathème ; +3 réussites auto pour le dominer.' } },
]

/** Exemples de motivations mineures (fiche 02, LdB p. 128). */
export const MOTIVATIONS_MINEURES_EXEMPLES: readonly string[] = [
  'Braver un danger pour un allié',
  'Protéger un équipier',
  'Protéger des innocents',
  'Soigner les gens',
  'Résoudre des meurtres',
  'Pratiquer un art',
  'Apaiser des tensions',
  'Promouvoir le Knight',
  'Combattre le désespoir',
  'Apprendre des choses',
]

/** Tous les avantages et inconvénients nommés, pour l'autocomplétion. */
export const TOUS_AVANTAGES: readonly Trait[] = LAMES.map((l) => l.avantage)
export const TOUS_INCONVENIENTS: readonly Trait[] = [
  ...LAMES.map((l) => l.inconvenient),
  ...SECTIONS.map((s) => s.inconvenient),
]
