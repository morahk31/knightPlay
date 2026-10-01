import type { Disponibilite, ModuleDef, ModuleLevel, Slots } from '../rules/types'

/**
 * Modules (référentiel : fiche 09 pour le livre de base, fiche 13 pour le codex 4).
 * Les coûts en PG sont par niveau ; les niveaux précédents doivent être possédés.
 */

type Lv = [pg: number, dispo: Disponibilite, effet: string]

function lv(levels: Lv[]): ModuleLevel[] {
  return levels.map(([pg, dispo, effet], i) => ({ niveau: i + 1, pg, dispo, effet }))
}

/** Slots : t = tête, bg/bd = bras, to = torse, jg/jd = jambes ; « b » ou « j » = 1 bras / chaque jambe. */
function s(spec: Partial<Record<'t' | 'bg' | 'bd' | 'to' | 'jg' | 'jd', number>>): Partial<Slots> {
  const out: Partial<Slots> = {}
  if (spec.t) out.tete = spec.t
  if (spec.bg) out.brasG = spec.bg
  if (spec.bd) out.brasD = spec.bd
  if (spec.to) out.torse = spec.to
  if (spec.jg) out.jambeG = spec.jg
  if (spec.jd) out.jambeD = spec.jd
  return out
}

const LDB = 'LdB p. 431-446'
const C4 = 'Codex 4 p. 13-15'

export const MODULES: readonly ModuleDef[] = [
  // Déplacement
  { id: 'saut', nom: 'Saut', categorie: 'Déplacement', slots: s({ jg: 1, jd: 1 }), activation: 'Action de déplacement',
    duree: 'Instantanée', energie: 3, effet: 'Saut hauteur courte, longueur moyenne ; +6 dégâts au contact en sautant sur l’ennemi.',
    niveaux: lv([[10, 'standard', 'Hauteur courte, longueur moyenne, +6 dégâts.'], [20, 'standard', 'Moyenne / longue, +2 réaction en l’air, +9 dégâts.'], [20, 'standard', 'Longue / lointaine (1 km), +12 dégâts.']]), source: LDB },
  { id: 'moto-steed', nom: 'Moto steed', categorie: 'Déplacement', slots: s({ to: 1 }), activation: 'Action de déplacement',
    duree: 'Jusqu’à désactivation', energie: 1, effet: 'Déploie une moto steed.', niveaux: lv([[30, 'standard', 'Moto incluse.']]), source: LDB },
  { id: 'wingsuit', nom: 'Wingsuit', categorie: 'Déplacement', slots: s({ to: 1 }), activation: 'Action de déplacement',
    duree: 'Jusqu’à désactivation', energie: 3, effet: 'Pas de dégâts de chute ; tir en l’air à −2 réussites ; +2 réaction.',
    niveaux: lv([[10, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'course', nom: 'Course', categorie: 'Déplacement', slots: s({ jg: 1, jd: 1 }), activation: 'Action de déplacement',
    duree: 'Instantanée', energie: 3, effet: 'Portée moyenne par action ; +6 dégâts en charge (on subit la moitié).',
    niveaux: lv([[20, 'standard', 'Portée moyenne, +6.'], [20, 'standard', 'Portée longue, +9.'], [30, 'standard', 'Portée lointaine, +12.']]), source: LDB },
  { id: 'deplacement-silencieux', nom: 'Déplacement silencieux', categorie: 'Déplacement', slots: s({ jg: 1, jd: 1, to: 1 }),
    activation: 'Action de déplacement', duree: '1 tour', energie: 2, effet: '+2 dés en Discrétion combo Déplacement ou Combat.',
    niveaux: lv([[10, 'avance', '+2 dés.'], [20, 'avance', '+4 dés.']]), source: LDB },
  { id: 'adherence', nom: 'Adhérence', categorie: 'Déplacement', slots: s({ jg: 2, jd: 2, bg: 2, bd: 2 }),
    activation: 'Action de déplacement', duree: '3 tours', energie: 3, effet: 'Grimper sur toute surface ; armes à une main.',
    niveaux: lv([[20, 'avance', '3 tours.'], [50, 'avance', 'Durée illimitée.']]), source: LDB },
  { id: 'vol', nom: 'Vol', categorie: 'Déplacement', slots: s({ jg: 2, jd: 2, bg: 2, bd: 2, to: 2, t: 1 }),
    activation: 'Action de déplacement', duree: '3 tours', energie: 5, effet: 'Vol à portée courte par tour.',
    niveaux: lv([[30, 'rare', 'Courte, 3 tours.'], [30, 'rare', 'Moyenne, 5 tours.'], [50, 'rare', 'Longue, 10 tours.']]), source: LDB },
  { id: 'teleportation', nom: 'Téléportation', categorie: 'Déplacement', slots: s({ jg: 2, jd: 2, bg: 2, bd: 2, to: 3, t: 1 }),
    activation: 'Action de déplacement', duree: 'Instantanée', energie: 10, effet: 'Téléportation à portée lointaine (zone visible).',
    niveaux: lv([[100, 'rare', 'Effet de base.']]), source: LDB },
  { id: 'phase', nom: 'Module de phase', categorie: 'Déplacement', slots: s({ jg: 1, jd: 1, bg: 1, bd: 1, to: 2, t: 1 }),
    activation: 'Action de déplacement', duree: '1 action par 50 cm', energie: 5, effet: 'Traverser 50 cm de matière (pas l’élément alpha).',
    niveaux: lv([[50, 'rare', 'Traverser la matière.'], [50, 'rare', 'Esquive totale d’une attaque (8 PE, sans action).']]), source: LDB },

  // Combat
  { id: 'griffes', nom: 'Griffes de combat', categorie: 'Combat', slots: s({ bd: 1 }), activation: 'Aucune (frapper : combat)',
    duree: 'Jusqu’à désactivation', energie: null, effet: '2D6+Force / 1D6, contact.',
    niveaux: lv([[10, 'standard', 'Profil de base.'], [10, 'standard', '+1D6, meurtrier ou choc 1.'], [30, 'rare', '+1D6, lesté ou pénétrant 5.']]), source: LDB },
  { id: 'lame-bras', nom: 'Lame de bras', categorie: 'Combat', slots: s({ bd: 2 }), activation: 'Aucune (frapper : combat)',
    duree: 'Jusqu’à désactivation', energie: null, effet: '2D6+Force / 1D6, contact.',
    niveaux: lv([[10, 'standard', 'Profil de base.'], [10, 'standard', '+1D6, orfèvrerie ou destructeur.'], [30, 'rare', '+1D6 / +1D6, perce armure 40 ou lumière 4.']]), source: LDB },
  { id: 'attaque-casque', nom: 'Attaque sur casque', categorie: 'Combat', slots: s({ t: 1 }), activation: 'Aucune',
    duree: 'Instantanée', energie: null, effet: '+1D6 dégâts au contact (chargeur 6).',
    niveaux: lv([[10, 'standard', 'Chargeur 6.'], [20, 'standard', 'Permanent.']]), source: LDB },
  { id: 'dard', nom: 'Dard', categorie: 'Combat', slots: s({ bd: 1 }), activation: 'Action de déplacement', duree: 'Instantanée',
    energie: null, effet: 'Force / 1, silencieux, chargeur 3 ; neurotoxine, sédatif ou nanomachines.',
    niveaux: lv([[20, 'avance', 'Chargeur 3.'], [15, 'avance', 'Chargeur 6.'], [15, 'avance', 'Les trois substances à la fois.']]), source: LDB },
  { id: 'amplification', nom: 'Amplification de frappe', categorie: 'Combat', slots: s({ bd: 2 }), activation: 'Aucune',
    duree: 'Instantanée', energie: 1, energieTexte: '1 PE par dé ajouté', effet: '+1D6 à +6D6 au contact ; 2 dégâts aux PA par dé au-delà du premier.',
    niveaux: lv([[20, 'avance', 'Contrecoup.'], [20, 'avance', '3 dés sans contrecoup.'], [30, 'avance', 'Aucun contrecoup.']]), source: LDB },
  { id: 'decoupeur', nom: 'Découpeur', categorie: 'Combat', slots: s({ bd: 2 }), activation: 'Action de déplacement',
    duree: 'Jusqu’à désactivation', energie: 1, effet: '3D6+Force / 1, ignore armure, anti-véhicule ; −3 dés pour toucher.',
    niveaux: lv([[50, 'avance', 'Effet de base.']]), source: LDB },
  { id: 'attaque-portee', nom: 'Attaque portée', categorie: 'Combat', slots: s({ bg: 1, bd: 1 }), activation: 'Action de déplacement',
    duree: 'Instantanée', energie: 5, effet: 'Frappe de contact à portée longue (Perception ou Dextérité 5 requise).',
    niveaux: lv([[30, 'rare', 'Effet de base.'], [40, 'rare', 'La cible a 0 en défense.']]), source: LDB },
  { id: 'nova', nom: 'Nova', categorie: 'Combat', slots: s({ to: 2 }), activation: 'Action de combat', duree: 'Instantanée',
    energie: 6, effet: 'Choc 1 automatique au contact (Chair < 10).',
    niveaux: lv([[20, 'rare', 'Chair < 10.'], [20, 'rare', 'Chair < 14.'], [20, 'rare', 'Chair < 18, portée courte, bandes comprises.']]), source: LDB },
  { id: 'attaque-non-letale', nom: 'Attaque non létale', categorie: 'Combat', slots: s({ bd: 1 }), activation: 'Action de combat',
    duree: 'Instantanée', energie: 1, effet: '1D6+6 / 1, courte, choc 1, chargeur 6 ; ne tue pas.',
    niveaux: lv([[10, 'standard', 'Choc 1.'], [10, 'standard', 'Choc 2.'], [10, 'standard', 'Sans chargeur.']]), source: LDB },
  { id: 'balder', nom: 'Canon Balder', categorie: 'Combat', slots: s({ bd: 2 }), activation: 'Action de déplacement',
    duree: 'Instantanée', energie: 1, energieTexte: '1 PE (+2 PE par D6, +3D6 max)', effet: '1D6 / 1D6, moyenne, anti-Anathème.',
    niveaux: lv([[30, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'canon-bras', nom: 'Canon de bras', categorie: 'Combat', slots: s({ bd: 2 }), activation: 'Action de combat',
    duree: 'Instantanée', energie: 1, effet: '3D6+3 / 3D6+3, moyenne, meurtrier, destructeur ou ultraviolence.',
    niveaux: lv([[30, 'avance', 'Effet de base.'], [30, 'avance', '+1 effet, +1D6.'], [30, 'rare', '+1 effet (ignore armure, ignore CdF ou anti-véhicule), +1D6.']]), source: LDB },
  { id: 'grappin', nom: 'Grappin', categorie: 'Combat', slots: s({ bd: 1 }), activation: 'Action de combat', duree: 'Instantanée',
    energie: 1, effet: '+1 réussite auto en escalade, pas d’échec critique ; attire une cible de Chair < 8.',
    niveaux: lv([[20, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'arme-torse', nom: 'Arme de torse', categorie: 'Combat', slots: s({ to: 2 }), activation: 'Action de combat',
    duree: 'Instantanée', energie: 8, effet: '7D6+6 / 7D6+6, courte, ultraviolence, dispersion 6, chargeur 1.',
    niveaux: lv([[20, 'avance', 'Chargeur 1.'], [30, 'avance', 'Chargeur 3.']]), source: LDB },
  { id: 'pod-missile', nom: 'Pod missile', categorie: 'Combat', slots: s({ to: 2 }), activation: 'Action de déplacement',
    duree: 'Instantanée', energie: 1, effet: '6D6+3 / 1D6+6, longue, artillerie, anti-véhicule, chargeur 3 ; cible désignée obligatoire.',
    niveaux: lv([[30, 'avance', 'Effet de base.']]), source: LDB },
  { id: 'canon-defensif', nom: 'Canon défensif', categorie: 'Combat', slots: s({ to: 2 }), activation: 'Aucune', duree: 'Instantanée',
    energie: null, effet: '2D6 automatiques sur un attaquant au contact ; +1D6 violence au tir à portée courte.',
    niveaux: lv([[30, 'avance', 'Contact, 2D6.'], [20, 'avance', 'Portée courte, 3D6.'], [20, 'avance', 'Portée moyenne, 4D6.']]), source: LDB },
  { id: 'pod-roquette', nom: 'Pod roquette', categorie: 'Combat', slots: s({ to: 2 }), activation: 'Action de déplacement',
    duree: 'Instantanée', energie: 1, effet: '1D6+6 / 6D6+12, longue, ultraviolence, chargeur 3.',
    niveaux: lv([[30, 'avance', 'Effet de base.'], [20, 'avance', '+2D6 violence au lieu de l’ultraviolence.'], [30, 'rare', 'Démoralisant, chargeur 6.']]), source: LDB },
  { id: 'sol-invictus', nom: 'Canon Sol Invictus', categorie: 'Combat', slots: s({ bd: 3, to: 1 }), activation: 'Action de combat',
    duree: 'Instantanée', energie: 1, energieTexte: '1 PE (+1 PE par D6, +8D6 max)', effet: '3D6 / 3D6, moyenne, ignore CdF, anti-Anathème, lumière 6.',
    niveaux: lv([[80, 'rare', 'Effet de base.']]), source: LDB },

  // Visée et défense
  { id: 'vue-alternative', nom: 'Vue alternative', categorie: 'Visée', slots: s({ t: 1 }), activation: 'Aucune', duree: 'Scène',
    energie: 2, effet: 'Vision thermique, magnétique, heartbeat ou prédatrice.',
    niveaux: lv([[10, 'standard', '1 vision.'], [10, 'standard', '2ᵉ vision.'], [20, 'standard', '3ᵉ vision.']]), source: LDB },
  { id: 'designation', nom: 'Désignation', categorie: 'Visée', slots: s({ t: 1 }), activation: 'Aucune', duree: 'Scène',
    energie: 2, effet: 'Effet désignation à portée longue.',
    niveaux: lv([[10, 'standard', '1 cible.'], [20, 'standard', '1 bande + 2 cibles.'], [30, 'standard', '1 bande + 3 cibles.']]), source: LDB },
  { id: 'fumigene', nom: 'Fumigène', categorie: 'Défense', slots: s({ to: 1 }), activation: 'Action de déplacement', duree: 'Scène',
    energie: 2, effet: '+2 défense et réaction, −3 dés au tir, pour tous à portée courte.',
    niveaux: lv([[10, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'flash', nom: 'Flash', categorie: 'Défense', slots: s({ t: 1 }), activation: 'Aucune', duree: '1 tour', energie: 2,
    effet: 'Lumière 2 ; choc 1 au contact si Chair ≤ 8.', niveaux: lv([[15, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'canon-tnl', nom: 'Canon TNL', categorie: 'Défense', slots: s({ bd: 2 }), activation: 'Action de déplacement',
    duree: 'Instantanée', energie: 1, effet: 'Choc 1 sur une cible de Chair ≤ 10 à portée courte.',
    niveaux: lv([[10, 'avance', 'Chair ≤ 10.'], [10, 'avance', 'Chair ≤ 12.'], [10, 'avance', 'Chair ≤ 14.']]), source: LDB },
  { id: 'contre-mesures', nom: 'Contre-mesures', categorie: 'Défense', slots: s({ to: 2 }), activation: 'Aucune', duree: 'Instantanée',
    energie: 2, effet: 'Annule un missile ou une roquette.',
    niveaux: lv([[20, 'avance', 'Chargeur 3.'], [10, 'avance', 'Chargeur 6.'], [10, 'avance', 'Chargeur 10.']]), source: LDB },
  { id: 'blindage-drone', nom: 'Blindage drone', categorie: 'Défense', slots: s({ to: 2 }), activation: 'Action de déplacement',
    duree: 'Scène', energie: 6, effet: '+2 CdF et +2 défense.',
    niveaux: lv([[30, 'rare', '+2 CdF, +2 défense.'], [30, 'rare', '+4 CdF, +3 défense.']]), source: LDB },
  { id: 'interception', nom: 'Interception', categorie: 'Défense', slots: s({ bg: 1, bd: 1, jg: 1, jd: 1, to: 1 }),
    activation: 'Action de combat', duree: '1 tour', energie: 5, effet: 'Agir à l’initiative d’un ennemi, juste avant lui.',
    niveaux: lv([[50, 'rare', 'Effet de base.'], [50, 'rare', 'Activation en déplacement, 2ᵉ action de combat.']]), source: LDB },
  { id: 'accumulation-force', nom: 'Accumulation de force', categorie: 'Défense', slots: s({ bg: 1, bd: 1, jg: 1, jd: 1, to: 1 }),
    activation: 'Aucune', duree: 'Scène', energie: 8, effet: '1D6 accumulé par 6 dégâts arrêtés par le CdF (8D6 max), relâchés au contact.',
    niveaux: lv([[50, 'rare', '8D6 max.'], [50, 'rare', '12D6 max, 1 tour sans CdF.']]), source: LDB },

  // Tactiques et utilitaires
  { id: 'relais-satellite', nom: 'Relais satellite', categorie: 'Tactique', slots: s({ t: 1 }), activation: 'Aucune', duree: 'Aucune',
    energie: 4, effet: 'Relevés topographiques.',
    niveaux: lv([[10, 'standard', 'Topographie.'], [10, 'standard', 'Thermique et magnétique.'], [10, 'standard', 'Haute définition.']]), source: LDB },
  { id: 'relais-taccom', nom: 'Relais TacCom', categorie: 'Tactique', slots: s({ t: 1 }), activation: 'Aucune',
    duree: 'Jusqu’à désactivation', energie: 1, effet: 'Lien permanent avec Camelot.', niveaux: lv([[20, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'cameraman', nom: 'Module caméraman', categorie: 'Tactique', slots: s({ t: 1 }), activation: 'Aucune',
    duree: 'Jusqu’à désactivation', energie: null, effet: 'Caméra et micro.', niveaux: lv([[10, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'banner', nom: 'Banner', categorie: 'Tactique', slots: s({ t: 1 }), activation: 'Action de déplacement', duree: 'Spécial',
    energie: 3, effet: 'Attire les ennemis de Machine < 8 à portée longue.', niveaux: lv([[10, 'avance', 'Effet de base.']]), source: LDB },
  { id: 'billes-sonar', nom: 'Billes sonar', categorie: 'Tactique', slots: s({ bd: 2 }), activation: 'Action de déplacement',
    duree: 'Scène', energie: null, effet: 'Détecte et désigne les êtres vivants, même invisibles (chargeur 9).',
    niveaux: lv([[20, 'avance', 'Effet de base.']]), source: LDB },
  { id: 'drone-espionnage', nom: 'Drone d’espionnage', categorie: 'Tactique', slots: s({ to: 1 }), activation: 'Action de déplacement',
    duree: 'Scène', energie: null, effet: 'Drone espion (portée 20 km).', niveaux: lv([[20, 'avance', 'Effet de base.']]), source: LDB },
  { id: 'diffuseur-nanom', nom: 'Diffuseur de nanoM', categorie: 'Tactique', slots: s({ to: 1 }), activation: 'Aucune',
    duree: 'Instantanée', energie: 5, effet: '+1D6 PS (automatique à 0 PS).',
    niveaux: lv([[20, 'avance', '+1D6 PS.'], [10, 'avance', '+2D6 PS.']]), source: LDB },
  { id: 'wolfpack', nom: 'Wolfpack', categorie: 'Tactique', slots: s({ t: 1 }), activation: 'Aucune', duree: 'Jusqu’à désactivation',
    energie: null, effet: 'Localise la coterie à 80 km.', niveaux: lv([[10, 'rare', 'Effet de base.']]), source: LDB },
  { id: 'couvert-portatif', nom: 'Couvert portatif', categorie: 'Tactique', slots: s({ to: 2 }), activation: 'Action de déplacement',
    duree: 'Scène', energie: null, effet: 'Crée un couvert (+2 réaction).',
    niveaux: lv([[20, 'rare', 'Chargeur 3.'], [10, 'rare', 'Chargeur 6, +1 réaction.'], [10, 'rare', 'Chargeur 9, +1 réaction.']]), source: LDB },
  { id: 'fusees-eclairantes', nom: 'Pod fusées éclairantes', categorie: 'Utilitaire', slots: s({ to: 1 }), activation: 'Action de déplacement',
    duree: '1D6 tours', energie: 2, effet: '−1 dé aux humains sans protection, −2 dés et lumière 2 à l’Anathème.',
    niveaux: lv([[10, 'standard', 'Chargeur 3.'], [30, 'standard', 'Lumière 4, chargeur 6.'], [50, 'standard', 'Anti-Anathème, chargeur 9.']]), source: LDB },
  { id: 'voyager', nom: 'Voyager', categorie: 'Utilitaire', slots: s({ to: 1 }), activation: '—', duree: '—', energie: null,
    effet: 'Pas besoin de manger ni de boire (30 jours).', niveaux: lv([[10, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'rigg', nom: 'Interface sensitive RIGG', categorie: 'Utilitaire', slots: s({ t: 2 }), activation: '—', duree: '—',
    energie: null, effet: 'Contrôle mental des machines à portée moyenne.', niveaux: lv([[30, 'standard', 'Effet de base.']]), source: LDB },
  { id: 'miniaturisation', nom: 'Miniaturisation', categorie: 'Utilitaire', slots: {}, activation: '—', duree: '—', energie: null,
    effet: 'Un module prend 1 slot de moins (ajustez les slots du module concerné).', niveaux: lv([[20, 'avance', 'Effet de base.']]), source: LDB },
  { id: 'thunder-security', nom: 'Thunder security', categorie: 'Utilitaire', slots: s({ t: 1, bg: 1, bd: 1, jg: 1, jd: 1, to: 1 }),
    activation: '—', duree: '—', energie: null, effet: 'Ignore le drain d’énergie, le parasitage et les IEM.',
    niveaux: lv([[50, 'avance', 'Effet de base.']]), source: LDB },
  { id: 'masse-controle', nom: 'Masse de contrôle', categorie: 'Utilitaire', slots: {}, activation: '—', duree: '—', energie: null,
    effet: '+1 slot sur chaque zone par niveau.', permanent: { slots: 1 },
    niveaux: lv([[50, 'rare', '+1 slot partout.'], [30, 'rare', '+1 slot partout.'], [30, 'rare', '+1 slot partout.']]), source: LDB },
  { id: 'accelerateur', nom: 'Accélérateur', categorie: 'Utilitaire', slots: s({ to: 1, bg: 1, bd: 1, jg: 1, jd: 1 }),
    activation: 'Aucune', duree: 'Instantanée', energie: 5, effet: '+1 action de déplacement.',
    niveaux: lv([[50, 'rare', '+1 action de déplacement.'], [100, 'rare', '+1 action de combat en plus.']]), source: LDB },
  { id: 'babel', nom: 'Interface Babel', categorie: 'Utilitaire', slots: s({ t: 1 }), activation: '—', duree: '—', energie: null,
    effet: 'Traduction universelle.', niveaux: lv([[50, 'rare', 'Effet de base.']]), source: LDB },

  // Améliorations et armes automatisées
  { id: 'blindage-ameliore', nom: 'Blindage amélioré', categorie: 'Amélioration', slots: {}, activation: '—', duree: 'Permanent',
    energie: null, effet: '+10 PA au total par niveau.', permanent: { pa: 10 },
    niveaux: lv([[30, 'avance', '+10 PA.'], [30, 'avance', '+10 PA.'], [30, 'rare', '+10 PA.']]), source: LDB },
  { id: 'energie-amelioree', nom: 'Énergie améliorée', categorie: 'Amélioration', slots: {}, activation: '—', duree: 'Permanent',
    energie: null, effet: '+10 PE au total par niveau.', permanent: { pe: 10 },
    niveaux: lv([[30, 'avance', '+10 PE.'], [30, 'avance', '+10 PE.'], [30, 'rare', '+10 PE.']]), source: LDB },
  { id: 'cdf-ameliore', nom: 'Champ de force amélioré', categorie: 'Amélioration', slots: {}, activation: '—', duree: 'Permanent',
    energie: null, effet: '+3 CdF par niveau.', permanent: { cdf: 3 },
    niveaux: lv([[40, 'avance', '+3 CdF.'], [40, 'avance', '+3 CdF.'], [40, 'rare', '+3 CdF.']]), source: LDB },
  { id: 'tourelle-automatisee', nom: 'Tourelle automatisée', categorie: 'Arme automatisée', slots: s({ to: 2 }),
    activation: 'Action de déplacement', duree: 'Scène', energie: null, effet: 'Tourelle (50 PA, CdF 6) qui attaque à 8D6 + 2 OD avec l’arme achetée.',
    niveaux: lv([[10, 'standard', '+ prix de l’arme.']]), source: LDB },
  { id: 'tourelle-epaule', nom: 'Tourelle d’épaule', categorie: 'Arme automatisée', slots: s({ to: 2, bd: 1 }),
    activation: 'Action de déplacement', duree: 'Instantanée', energie: 2, effet: 'Arme de tir (non lourde) qui tire avec une action de déplacement.',
    niveaux: lv([[30, 'avance', '+ prix de l’arme.']]), source: LDB },

  // Codex 4
  { id: 'accompagnement-tactique', nom: 'Accompagnement tactique', categorie: 'Tactique', slots: s({ t: 1 }),
    activation: 'Action de déplacement', duree: 'Instantanée', energie: null, effet: '+1D6 dégâts et violence d’un allié pendant un tour.',
    niveaux: lv([[20, 'standard', 'Effet de base.']]), source: C4 },
  { id: 'analyse-adversaires', nom: 'Analyse des adversaires', categorie: 'Tactique', slots: s({ t: 2 }), activation: '1 tour',
    duree: 'Instantanée', energie: null, effet: 'Révèle une information sur un PNJ (comme le mode Falcon).',
    niveaux: lv([[30, 'standard', 'Effet de base.']]), source: C4 },
  { id: 'drone-nods', nom: 'Drone pour nods', categorie: 'Tactique', slots: s({ to: 1 }), activation: 'Action de déplacement',
    duree: '1 tour', energie: null, effet: 'Apporte un nod à portée moyenne ; 3 nods en stock par mission.',
    niveaux: lv([[30, 'avance', 'Effet de base.']]), source: C4 },
  { id: 'flechettes-incandescentes', nom: 'Fléchettes incandescentes', categorie: 'Combat', slots: s({ to: 1 }),
    activation: 'Action de déplacement', duree: 'Instantanée', energie: null, effet: '3D6+6, anti-Anathème, ténébricide, chargeur 3 ; tous les PNJ à portée courte.',
    niveaux: lv([[20, 'avance', 'Effet de base.'], [25, 'avance', 'Violence 1D6, chargeur 6, lumière 2.'], [25, 'avance', '+1D6 / +1D6, chargeur 9.']]), source: C4 },
  { id: 'pack-nods', nom: 'Pack de nods', categorie: 'Utilitaire', slots: s({ to: 1 }), activation: '—', duree: '—', energie: null,
    effet: '3 nods supplémentaires par mission.', niveaux: lv([[25, 'avance', 'Par pack.']]), source: C4 },
  { id: 'grenade-sup', nom: 'Grenade intelligente supplémentaire', categorie: 'Utilitaire', slots: s({ to: 1 }), activation: '—',
    duree: '—', energie: null, effet: '+1 grenade intelligente par mission (3 fois maximum).', niveaux: lv([[15, 'avance', 'Par grenade.']]), source: C4 },
  { id: 'cdf-portatif', nom: 'Champ de force portatif', categorie: 'Défense', slots: s({ to: 1 }), activation: 'Action de déplacement',
    duree: '6 tours', energie: null, effet: 'Champ de force 4 (rayon 2 m), chargeur 3.',
    niveaux: lv([[15, 'avance', 'Chargeur 3.'], [15, 'avance', 'Chargeur 6.'], [15, 'avance', 'Chargeur 9.']]), source: C4 },
  { id: 'mega-armure', nom: 'Déploiement de méga-armure', categorie: 'Défense', slots: s({ t: 1, bg: 1, bd: 1, to: 1, jg: 1, jd: 1 }),
    activation: '1 tour', duree: 'Scène', energie: 6, energieTexte: '6 PE par tour', effet: '+30 PA, +1 OD de Force et d’Endurance.',
    niveaux: lv([[60, 'rare', 'Effet de base.']]), source: C4 },
  { id: 'camouflage-optique', nom: 'Camouflage optique', categorie: 'Défense', slots: s({ t: 1, bg: 1, bd: 1, to: 1, jg: 1, jd: 1 }),
    activation: 'Action de déplacement', duree: 'Variable', energie: 4, energieTexte: '4 PE par tour, 8 PE par minute',
    effet: 'Mode Ghost limité (OD de Discrétion requis).', niveaux: lv([[60, 'rare', 'Effet de base.']]), source: C4 },
  { id: 'deguisement', nom: 'Déguisement', categorie: 'Utilitaire', slots: s({ t: 1, bg: 1, bd: 1, to: 1, jg: 1, jd: 1 }),
    activation: 'Action de déplacement', duree: 'Variable', energie: 8, effet: 'Fausse apparence (mode Changeling limité).',
    niveaux: lv([[50, 'rare', 'Effet de base.']]), source: C4 },
  { id: 'capsules', nom: 'Capsules', categorie: 'Utilitaire', slots: s({ to: 1 }), activation: 'Action de déplacement',
    duree: '10 minutes', energie: 4, energieTexte: '4 PE (+2 par 10 minutes)', effet: 'Objets préprogrammés (bélier, muret, station médicale…).',
    niveaux: lv([[25, 'rare', '3 capsules.']]), source: C4 },
]

export function findModule(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id)
}

/** Coût total en PG pour atteindre un niveau (niveaux précédents compris). */
export function moduleCostToLevel(def: ModuleDef, niveau: number): number {
  return def.niveaux.slice(0, niveau).reduce((sum, l) => sum + l.pg, 0)
}
