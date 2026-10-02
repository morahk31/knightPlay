import type { CaracId } from '../rules/types'

/** Effets des overdrives par niveau (référentiel, fiche 09 ; LdB p. 442-446). Seuls les niveaux à effet sont listés. */
export const OD_EFFECTS: Record<CaracId, readonly [niveau: number, effet: string][]> = {
  deplacement: [
    [1, 'Déplacement court gratuit avec le module de course'],
    [2, 'Franchit les obstacles de sa taille'],
    [3, 'Déplacement moyen gratuit'],
    [4, 'Obstacles de 5 m ou moins'],
    [5, 'Pas de dégâts de chute sous 50 m'],
  ],
  force: [
    [1, '+3 dégâts au contact · soulève 500 kg'],
    [2, '+6 dégâts au contact · 2 t'],
    [3, '+9 dégâts au contact · 10 t'],
    [4, '+12 dégâts au contact · 30 t'],
    [5, '+15 dégâts au contact · 80 t'],
  ],
  endurance: [
    [2, 'Immunisé à choc 1'],
    [3, '+6 PS en armure'],
    [4, 'Immunisé à choc 2 et moins'],
    [5, 'Retire son Endurance au débordement des bandes'],
  ],
  hargne: [
    [3, 'Pas d’agonie à 0 PS (blessure grave)'],
    [4, 'Continue d’agir à 0 PS (test de Hargne)'],
    [5, 'Ignore la capacité Anathème'],
  ],
  combat: [
    [2, '+2 en réaction au corps à corps'],
    [3, 'Akimbo au contact à −1 dé'],
    [4, 'Ambidextre au contact à −1 dé'],
    [5, 'Violence sur une bande en plus des dégâts'],
  ],
  instinct: [
    [2, 'Initiative lancée deux fois, garde la meilleure'],
    [3, '+3 en initiative par OD d’Instinct'],
    [4, 'Garde défense, réaction et CdF en cas d’attaque surprise'],
    [5, 'Jamais pris en embuscade'],
  ],
  tir: [
    [2, 'Ignore le premier malus de portée'],
    [3, 'Akimbo au tir à −1 dé'],
    [4, 'Ambidextre au tir à −1 dé'],
    [5, 'Violence sur une bande en plus des dégâts'],
  ],
  savoir: [
    [1, 'Accès aux encyclopédies'],
    [2, 'Informations en temps réel'],
    [3, '+1D6 PS aux soins donnés'],
    [4, 'Accès aux bases de données'],
    [5, 'Ignore les échecs critiques'],
  ],
  technique: [
    [1, 'Connexion aux machines au contact'],
    [2, 'Comprend et répare toute machine'],
    [3, 'Connexion sans fil à portée lointaine'],
    [4, 'Réparation d’urgence (difficulté 9) : +6 PA'],
    [5, 'Programmes et virus'],
  ],
  aura: [
    [2, 'Attaqué en dernier par les humains'],
    [3, '2 contacts par scénario'],
    [4, 'Diversion'],
    [5, '+Aura à la défense'],
  ],
  parole: [
    [1, 'Maintient en vie un allié mourant'],
    [2, '+1D6 PEs à un allié (une fois par mission)'],
    [3, 'Imite les voix entendues'],
    [4, 'Hypnose des humains'],
    [5, '+2D6 PEs à un allié'],
  ],
  sangFroid: [
    [2, 'Ignore le stress'],
    [3, 'Relance un test d’espoir raté'],
    [4, 'Ignore la peur'],
    [5, 'Ignore la domination'],
  ],
  discretion: [
    [2, '+Discrétion (sans OD) aux dégâts contre un ennemi qui ne le voit pas'],
    [3, 'Pas de bruit de pas'],
    [4, 'Invisible à l’arrêt (Machine ou Masque < 12)'],
    [5, '+Discrétion avec OD aux dégâts, peut lancer une embuscade'],
  ],
  dexterite: [
    [3, 'Jamais désarmé ni renversé'],
    [4, 'Ignore lourd ; peut remplacer Combat ou Tir par Dextérité'],
    [5, 'Défense à la place de la réaction contre les tirs'],
  ],
  perception: [
    [1, 'Zoom ×400'],
    [2, 'Zoom audio'],
    [3, 'Odorat et toucher'],
    [4, 'Informations en réalité augmentée'],
    [5, 'Sonar ; garde défense et réaction en cas d’attaque surprise'],
  ],
}
