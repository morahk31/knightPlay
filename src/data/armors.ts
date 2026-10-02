import type { ArmorDef, Slots } from '../rules/types'

/**
 * Méta-armures (référentiel : fiche 06 pour le livre de base, fiche 13 pour 2038 et le codex 4).
 * Les slots et OD de base sont extraits de schémas graphiques : `aVerifier: true`.
 * Toutes les valeurs restent modifiables sur la fiche du personnage.
 */

const slots = (tete: number, brasG: number, brasD: number, torse: number, jambeG: number, jambeD: number): Slots => ({
  tete, brasG, brasD, torse, jambeG, jambeD,
})

export const ARMORS: readonly ArmorDef[] = [
  {
    id: 'warrior', nom: 'Warrior', generation: 1, pa: 100, pe: 40, cdf: 8,
    od: { combat: 1, deplacement: 1, tir: 1, dexterite: 1 },
    slots: slots(7, 10, 10, 12, 7, 7), aVerifier: true, source: 'LdB p. 135-137',
    capacites: [
      { id: 'type', nom: 'Type (Soldier, Hunter, Scholar, Herald, Scout)', cout: 1,
        energie: '1 PE par tour en conflit, 6 PE par scène hors conflit',
        activation: 'Action de déplacement', duree: '1 tour ou une scène',
        effet: '+1 OD dans les 3 caractéristiques de l’aspect du type (hors limite de 5). Un seul type actif, un changement par tour. 3 types connus à la création.' },
    ],
    evolutions: [
      { pg: 150, effet: 'Activer un type ne coûte plus d’action.' },
      { pg: 200, effet: 'Le chevalier possède tous les types.' },
      { pg: 250, effet: 'Les types donnent 2 OD par caractéristique.' },
    ],
  },
  {
    id: 'paladin', nom: 'Paladin', generation: 1, pa: 120, pe: 20, cdf: 8,
    od: { force: 1, endurance: 1, tir: 1, perception: 1 },
    slots: slots(7, 7, 7, 10, 7, 7), aVerifier: true, source: 'LdB p. 139-141',
    capacites: [
      { id: 'shrine', nom: 'Champ de force Shrine', cout: 1, energie: '1 PE par tour (2 à portée moyenne)',
        activation: 'Aucune', duree: '1 tour',
        effet: 'Dôme de 6 m : +6 CdF à ceux qui sont dedans (Force 5 ou Chair 10 pour entrer). Ignoré par « ignore CdF ».' },
      { id: 'watchtower', nom: 'Mode Watchtower', cout: 2, energie: '2 PE, puis 1 PE par tir supplémentaire',
        activation: 'Action de déplacement', duree: 'Jusqu’à désactivation',
        effet: 'Immobile, réaction ÷ 2, +1 action de combat de tir par tour (dès le tour suivant).' },
      { id: 'lente', nom: 'Lente et lourde', cout: null, energie: '—', activation: 'Permanent', duree: 'Permanent',
        effet: 'Pas de modules de course, saut ni déplacement silencieux. Difficulté +1 niveau en Discrétion et Déplacement.' },
    ],
    evolutions: [
      { pg: 150, effet: 'Armes de tir slotées sur les bras.' },
      { pg: 200, effet: 'Shrine à +8 CdF ; sur soi 5 PE pour 6 tours, à portée moyenne 10 PE.' },
      { pg: 250, effet: 'Plus de « lente et lourde ».' },
    ],
  },
  {
    id: 'priest', nom: 'Priest', generation: 1, pa: 70, pe: 60, cdf: 10,
    od: { force: 1, endurance: 1, savoir: 1, technique: 1 },
    slots: slots(5, 5, 5, 8, 5, 5), aVerifier: true, source: 'LdB p. 143-145',
    capacites: [
      { id: 'nanoc-forme', nom: 'Mode nanoC — forme simple', cout: 3, energie: '3 PE (+2 PE par minute)',
        activation: 'Déplacement, combat ou 1 tour', duree: '1 minute', effet: 'Forme simple de 3 m³ maximum. Test base Technique.' },
      { id: 'nanoc-objet', nom: 'Mode nanoC — objet détaillé', cout: 6, energie: '6 PE', activation: 'Déplacement, combat ou 1 tour',
        duree: '1 minute', effet: 'Objet détaillé de 2 m³ maximum.' },
      { id: 'nanoc-meca', nom: 'Mode nanoC — objet mécanique', cout: 9, energie: '9 PE', activation: 'Déplacement, combat ou 1 tour',
        duree: '1 minute', effet: 'Objet mécanique ou électronique de 1 m³ maximum.' },
      { id: 'mechanic-contact', nom: 'Mode Mechanic (contact)', cout: 4, energie: '4 PE', activation: 'Action de déplacement',
        duree: 'Instantanée', effet: 'Répare 3D6+6 PA.' },
      { id: 'mechanic-distance', nom: 'Mode Mechanic (portée longue)', cout: 6, energie: '6 PE', activation: 'Action de déplacement',
        duree: 'Instantanée', effet: 'Répare 2D6+6 PA à distance.' },
    ],
    evolutions: [
      { pg: 150, effet: 'Constructions nanoC : 1 h (+2 PE par heure).' },
      { pg: 200, effet: 'Mechanic : +1D6+6.' },
      { pg: 250, effet: 'Création de véhicules (9 PE, 1 h).' },
    ],
  },
  {
    id: 'warmaster', nom: 'Warmaster', generation: 1, pa: 90, pe: 50, cdf: 8,
    od: { force: 1, endurance: 1, aura: 1, sangFroid: 1 },
    slots: slots(5, 5, 5, 8, 5, 5), aVerifier: true, source: 'LdB p. 147-149',
    capacites: [
      { id: 'imp-action', nom: 'Impulsion d’action', cout: 4, energie: '4 PE (10 sur soi, FAQ 2020)', activation: 'Action de déplacement',
        duree: '1 tour', effet: 'Un allié gagne une action au prochain tour.' },
      { id: 'imp-esquive', nom: 'Impulsion d’esquive', cout: 3, energie: '3 PE par allié (+2 par tour)', activation: 'Action de déplacement',
        duree: '1 tour (prolongeable)', effet: '+2 défense et réaction.' },
      { id: 'imp-force', nom: 'Impulsion de force', cout: 2, energie: '2 PE par allié (+1 par tour)', activation: 'Action de déplacement',
        duree: '1 tour (prolongeable)', effet: '+2 CdF.' },
      { id: 'imp-guerre', nom: 'Impulsion de guerre', cout: 1, energie: '1 PE par allié (+1 par tour)', activation: 'Action de déplacement',
        duree: '1 tour (prolongeable)', effet: '+1D6 dégâts et violence.' },
      { id: 'imp-energie', nom: 'Impulsion d’énergie', cout: null, energie: '1 à 5 PE', activation: 'Action de déplacement',
        duree: 'Instantanée', effet: 'Donne 1 à 5 PE à un allié.' },
      { id: 'falcon', nom: 'Mode Falcon', cout: 6, energie: '6 PE', activation: 'Action de déplacement', duree: 'Instantanée',
        effet: 'Révèle une information sur un PNJ (aspects, défense et réaction, points faibles…).' },
    ],
    evolutions: [
      { pg: 150, effet: '+10 PE au total.' },
      { pg: 200, effet: 'Toutes les impulsions.' },
      { pg: 250, effet: 'Falcon sans action pour 3 PE ; +10 PE au total.' },
    ],
  },
  {
    id: 'rogue', nom: 'Rogue', generation: 2, pa: 50, pe: 70, cdf: 12,
    od: { deplacement: 1, dexterite: 1, discretion: 1, combat: 1 },
    slots: slots(5, 5, 5, 8, 5, 5), aVerifier: true, source: 'LdB p. 151-153',
    capacites: [
      { id: 'ghost', nom: 'Mode Ghost', cout: 2, energie: '2 PE par tour en conflit, 6 PE par minute hors conflit',
        activation: 'Aucune', duree: '1 tour ou 1 minute',
        effet: 'Invisible et silencieux. +3 réussites auto pour passer inaperçu. 1ʳᵉ attaque : +Discrétion (OD compris) en dés et en dégâts, puis le mode s’arrête.' },
    ],
    evolutions: [
      { pg: 150, effet: '2 PE pour 6 tours, 6 PE pour 15 minutes.' },
      { pg: 200, effet: 'Seule la Machine exceptionnelle majeure détecte la Rogue.' },
      { pg: 250, effet: '3 PE par attaque pour rester invisible.' },
    ],
  },
  {
    id: 'ranger', nom: 'Ranger', generation: 2, pa: 50, pe: 70, cdf: 12,
    od: { deplacement: 1, dexterite: 1, discretion: 1, tir: 1 },
    slots: slots(4, 4, 4, 6, 4, 4), aVerifier: true, source: 'LdB p. 155-157',
    capacites: [
      { id: 'longbow-1', nom: 'Longbow : +1D6 ou +1 cran de portée', cout: 1, energie: '1 PE par effet',
        activation: 'Aucune', duree: '1 tir', effet: '+1D6 dégâts ou violence (max +6D6), ou portée +1 cran.' },
      { id: 'longbow-2', nom: 'Longbow : effet à 2 PE', cout: 2, energie: '2 PE par effet (3 max)', activation: 'Aucune',
        duree: '1 tir', effet: 'Dégâts continus 3, silencieux, choc 1, perce armure 40, ultraviolence, désignation.' },
      { id: 'longbow-3', nom: 'Longbow : effet à 3 PE', cout: 3, energie: '3 PE par effet (3 max)', activation: 'Aucune',
        duree: '1 tir', effet: 'Lumière 4, dispersion 3, artillerie, pénétrant 6, perce armure 60, anti-véhicule.' },
      { id: 'vision', nom: 'La Vision', cout: 5, energie: '5 à 10 PE', activation: 'Action de déplacement',
        duree: '6 secondes', effet: 'Voir l’invisible (gaz, pensées, Ghost…). Test base Perception (difficulté 2 à 9).' },
    ],
    evolutions: [
      { id: 'longbow-majeurs', pg: 50, achetee: true, effet: 'Effets à 6 PE : anti-Anathème, démoralisant, pénétrant 10, ignore armure, en chaîne, fureur.' },
      { id: 'longbow-profil', pg: 50, achetee: true, effet: 'Profil de base 5D6 / 3D6, plafond +9D6.' },
      { id: 'longbow-mobile', pg: 50, achetee: true, effet: 'Le Longbow perd l’effet lourd.' },
      { id: 'longbow-economie', pg: 100, achetee: true, effet: 'Effets ajoutés à −2 PE (minimum 1).' },
    ],
  },
  {
    id: 'bard', nom: 'Bard', generation: 2, pa: 40, pe: 80, cdf: 12,
    od: { deplacement: 1, dexterite: 1, parole: 1, aura: 1 },
    slots: slots(5, 5, 5, 8, 5, 5), aVerifier: true, source: 'LdB p. 159-161',
    capacites: [
      { id: 'changeling', nom: 'Mode Changeling (soi)', cout: 6, energie: '6 PE', activation: '1 tour',
        duree: 'Une scène ou une heure', effet: 'Fausse apparence. Percer : PNJ Machine difficulté 6, PJ Perception difficulté 3.' },
      { id: 'changeling-etendu', nom: 'Mode Changeling (taille étendue)', cout: 8, energie: '8 PE', activation: '1 tour',
        duree: 'Une scène ou une heure', effet: 'Apparence plus grande.' },
      { id: 'faux-etre', nom: 'Faux être', cout: 3, energie: '3 PE par faux être (4 max)', activation: '1 tour',
        duree: 'Une scène ou une heure', effet: 'Projection intangible à 3 m maximum.' },
    ],
    evolutions: [
      { pg: 150, effet: 'Portée moyenne et alliés (4 maximum).' },
      { pg: 200, effet: '−2 PE ; détection plus difficile (9 PNJ, 6 PJ).' },
      { pg: 250, effet: 'Explosion de nanomachines (3D6+6, ignore armure et CdF, dispersion 6, choc 1).' },
    ],
  },
  {
    id: 'wizard', nom: 'Wizard', generation: 3, pa: 40, pe: 80, cdf: 14,
    od: { sangFroid: 1, instinct: 1, combat: 1, aura: 1 },
    slots: slots(5, 5, 5, 8, 5, 5), aVerifier: true, source: 'LdB p. 163-165',
    capacites: [
      { id: 'borealis-armes', nom: 'Borealis : armes anti-Anathème', cout: 6, energie: '6 PE (+2 par allié)', activation: '1 tour',
        duree: 'Phase ou scène', effet: 'Les armes d’un allié gagnent anti-Anathème.' },
      { id: 'borealis-attaque', nom: 'Borealis : attaque de plasma', cout: 2, energie: '2 PE (1 PE selon la FAQ 2020)',
        activation: 'Action de combat', duree: 'Instantanée', effet: '4D6 / 4D6, courte, anti-Anathème, dégâts continus 3.' },
      { id: 'borealis-outil', nom: 'Borealis : outil', cout: 6, energie: '6 PE', activation: '1 tour', duree: '6 tours ou 1 minute',
        effet: 'Manipulation utilitaire du plasma.' },
      { id: 'oriflamme', nom: 'Mode Oriflamme', cout: 12, energie: '12 PE', activation: 'Action de déplacement', duree: 'Instantanée',
        effet: 'Zone courte : 6D6+6 / 6D6+12 aux créatures de l’Anathème (moitié à portée moyenne), sans jet.' },
    ],
    evolutions: [
      { pg: 150, effet: 'Borealis à portée moyenne.' },
      { pg: 200, effet: '−3 PE sur Borealis et Oriflamme (minimum 1).' },
      { pg: 250, effet: 'Oriflamme à portée moyenne.' },
    ],
  },
  {
    id: 'barbarian', nom: 'Barbarian', generation: 2, pa: 60, pe: 60, cdf: 12,
    od: { force: 1, endurance: 1, combat: 1, hargne: 1 },
    slots: slots(5, 5, 5, 8, 5, 5), aVerifier: true, source: 'LdB p. 167-169',
    capacites: [
      { id: 'goliath', nom: 'Mode Goliath (par mètre)', cout: 2, energie: '2 PE par mètre gagné', activation: 'Action de déplacement',
        duree: '6 tours ou 1 minute',
        effet: 'Par mètre : +1 réussite (Force ou Endurance), +1D6 dégâts et violence au contact, +1 CdF ; −1 défense, −2 réaction. Max 6 m.' },
    ],
    evolutions: [
      { pg: 150, effet: 'Jusqu’à 8 m.' },
      { pg: 200, effet: 'La défense ne baisse plus.' },
      { pg: 250, effet: 'Jusqu’à 10 m.' },
    ],
  },
  {
    id: 'psion', nom: 'Psion', generation: 3, pa: 50, pe: 60, cdf: 14,
    od: { instinct: 1, savoir: 1, perception: 1, sangFroid: 1 },
    slots: slots(7, 10, 10, 12, 7, 7), aVerifier: true, source: '2038 p. 9-12',
    notes: 'Utilise aussi des points de flux (récoltés contre l’Anathème et les désespérés).',
    capacites: [
      { id: 'puppet', nom: 'Mode Puppet Master', cout: 2, energie: '2 PE et 1 flux (+3 PE et 1 flux par créature)',
        activation: 'Action de déplacement', duree: '1 tour', effet: 'Ordre de 1 à 3 mots à un hostile de l’Anathème.' },
      { id: 'discord', nom: 'Mode Discord', cout: 2, energie: '2 PE et 1 flux par tour, ou 6 PE et 3 flux par scène',
        activation: 'Action de déplacement', duree: '1 tour ou une scène', effet: 'Hostiles : −2 dés, −2 défense et réaction.' },
      { id: 'windtalker', nom: 'Mode Windtalker', cout: 4, energie: '4 PE et 2 flux', activation: 'Action de déplacement',
        duree: 'Instantanée', effet: 'Révèle les tactiques et la prochaine action des créatures.' },
    ],
    evolutions: [
      { pg: 150, effet: 'Puppet Master sur les salopards (test base Aura).' },
      { pg: 200, effet: 'Discord sur les salopards ; −3 dés, −3 défense et réaction.' },
      { pg: 250, effet: 'Puppet Master sur les bandes.' },
    ],
  },
  {
    id: 'monk', nom: 'Monk', generation: 3, pa: 60, pe: 50, cdf: 14,
    od: { hargne: 1, tir: 1, combat: 1, sangFroid: 1 },
    slots: slots(7, 8, 8, 10, 6, 6), aVerifier: true, source: '2038 p. 13-16',
    notes: 'Chaque utilisation du mode Céa coûte aussi 1 point d’espoir (récupérable par le mode Zen).',
    capacites: [
      { id: 'cea-vague', nom: 'Céa : vague', cout: 3, energie: '3 PE et 1 espoir', activation: 'Action de combat',
        duree: 'Instantanée', effet: '3D6 / 3D6, contact ou courte, parasitage 2, dispersion 3, destructeur, choc 2.' },
      { id: 'cea-salve', nom: 'Céa : salve', cout: 3, energie: '3 PE et 1 espoir', activation: 'Action de combat',
        duree: 'Instantanée', effet: '3D6 / 3D6, moyenne, ultraviolence, meurtrier, dispersion 3, parasitage 1.' },
      { id: 'cea-rayon', nom: 'Céa : rayon', cout: 3, energie: '3 PE et 1 espoir', activation: 'Action de combat',
        duree: 'Instantanée', effet: '4D6 / 2D6, moyenne, perce armure 40, parasitage 1 ; +1D6 par tour maintenu.' },
      { id: 'zen', nom: 'Mode Zen', cout: null, energie: '—', activation: '1 heure', duree: '—',
        effet: 'Test Hargne combo Sang-froid (difficulté 5) : récupère la moitié des espoirs perdus par le Céa.' },
    ],
    evolutions: [
      { pg: 150, effet: '+2D6 dégâts et violence au Céa.' },
      { pg: 200, effet: 'Zen possible pendant toute la mission.' },
      { pg: 250, effet: 'Parasitage 4, dispersion 6, ignore armure ; encore +2D6.' },
    ],
  },
  {
    id: 'sorcerer', nom: 'Sorcerer', generation: 4, pa: 60, pe: 80, cdf: 14,
    od: { instinct: 1, dexterite: 1, endurance: 1, sangFroid: 1 },
    slots: slots(7, 8, 8, 10, 6, 6), aVerifier: true, source: '2038 p. 16-19',
    notes: '4ᵉ génération : pas de PS, agonie à 0 PA. Énergie déficiente (pas de recharge au repos). Modules +5/+10/+15 PG.',
    rechargeRepos: false,
    capacites: [
      { id: 'morph', nom: 'Mode Morph', cout: 10, energie: '10 PE et 1 espoir', activation: 'Aucune',
        duree: 'Scène ou phase', effet: '3 capacités : vol en nuée, phase, étirement, corps de métal (+2 CdF), corps fluide (+2 défense et réaction), polymorphie de guerre.' },
      { id: 'ponction', nom: 'Ponction d’énergie', cout: null, energie: 'Gain de 1 à 3D6 PE', activation: 'Action de déplacement',
        duree: 'Instantanée', effet: 'Prend de l’énergie à un allié consentant (au contact).' },
    ],
    evolutions: [
      { pg: 150, effet: 'Capacités améliorées (vol 2, phase 2, +4 CdF, +3 défense et réaction…).' },
      { pg: 250, effet: 'Les 6 capacités à la fois.' },
    ],
  },
  {
    id: 'necromancer', nom: 'Necromancer', generation: 4, pa: 80, pe: 100, cdf: 12,
    od: {},
    slots: slots(12, 12, 12, 12, 12, 12), aVerifier: true, source: '2038 p. 21-23',
    notes: 'Chevalier mort : 4 OD à répartir (« plus fort que la chair »), 10 espoir fixes, pas de mode héroïque, aucune évolution.',
    capacites: [],
    evolutions: [],
  },
  {
    id: 'druid', nom: 'Druid', generation: 3, pa: 50, pe: 80, cdf: 12,
    od: { tir: 1, combat: 1, technique: 1, instinct: 1 },
    slots: slots(5, 5, 5, 8, 5, 5), aVerifier: false, source: 'Codex 4 p. 3-8',
    notes: 'Le compagnon emprunte 10 à 50 PE au total de la Druid tant qu’il existe.',
    capacites: [
      { id: 'companion', nom: 'Mode Companions (Lion, Wolf ou Crow)', cout: 16, energie: '16 PE (8 pour prolonger)',
        activation: '1 tour', duree: 'Scène ou phase', effet: 'Génère un type de compagnon.' },
      { id: 'wolf-config', nom: 'Configuration Wolf', cout: 4, energie: '4 PE (pris aux compagnons)',
        activation: 'Action de déplacement', duree: 'Scène ou phase', effet: 'Labor, Medic, Tech, Fighter ou Recon : +1 dé par compagnon.' },
    ],
    evolutions: [{ pg: 100, effet: 'Tous les 100 PG : un type de compagnon évolue.' }],
  },
]

export function findArmor(id: string): ArmorDef | undefined {
  return ARMORS.find((a) => a.id === id)
}
