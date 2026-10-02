---
objective: "La partie modification de la fiche est lisible d'un coup d'œil, sans texte tronqué ni champ illisible, et chaque onglet met en avant ses informations clés."
status: implemented
---

# Plan: Améliorer l'affichage de la modification de la fiche

## Overview

| Field      | Value |
| ---------- | ----- |
| **Goal**   | Refondre la présentation des onglets d'édition et de la colonne d'actions, à fonctionnalités et calculs constants. |
| **Source** | Demande utilisateur (texte) : « Fait moi un plan pour améliorer l'affichage de la partie modification de la fiche du personnage ». Constats tirés de captures de chaque onglet avec Silas Shark (1366 px). Maquette validée : https://claude.ai/artifact/Nupies7Tup9MPT2uEyB5Nq |

### Constats de départ

| Zone | Problème observé |
| --- | --- |
| Identité & Aspects | Noms de caractéristiques tronqués (« Déplace… », « Sang-fr… »), OD effectifs affichés en « =1 » minuscule, différence OD achetés / OD effectifs peu claire. |
| Valeurs dérivées | Tableau très large (5 colonnes) pour 6 valeurs ; colonne « Manuelle » presque toujours vide. |
| Identité | Long formulaire d'un seul tenant ; description sur 2 lignes avec défilement interne. |
| Méta-armure | Champs d'OD de base trop étroits (valeur invisible), slots mal alignés, capacités en liste brute. |
| Modules / Armes | Cartes toutes dépliées, occupation des slots en petit texte, arbres de légende très hauts. |
| Notes | Onglet jamais construit (« Contenu de l'onglet à venir »). |
| Colonne d'actions | 5 panneaux empilés (Test, Attaque, Encaisser, Énergie, Journal) sur plus de 2 écrans. |

## Phases

| #   | Phase | File |
| --- | ----- | ---- |
| 1   | Socle visuel et composants communs | [`phase-1.md`](./phase-1.md) |
| 2   | Onglet Identité & Aspects | [`phase-2.md`](./phase-2.md) |
| 3   | Méta-armure et Modules | [`phase-3.md`](./phase-3.md) |
| 4   | Armes et Progression | [`phase-4.md`](./phase-4.md) |
| 5   | Colonne d'actions en onglets et onglet Notes | [`phase-5.md`](./phase-5.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Garder l'édition en place (pas de mode « lecture / édition » séparé) | La fiche sert pendant la partie et entre les parties ; un bouton de bascule ajouterait un clic à chaque modification. La page Récap couvre déjà la lecture seule. |
| Colonne d'actions en onglets (Test, Attaque, Encaisser, Énergie, Journal), onglet mémorisé | Validé par l'utilisateur sur la maquette. Un seul panneau d'action visible à la fois, sans défilement ; le journal reste accessible en un clic. |
| Saisie directe des valeurs de la fiche, sans boutons − / + (aspects, caractéristiques, valeurs de l'armure) | Demandé par l'utilisateur sur la maquette : les boutons sont inutiles et chargent les cartes. Les − / + restent seulement sur les jauges de la barre du haut. |
| Slots de l'armure disposés en forme de corps (tête, bras, torse, jambes) | Validé par l'utilisateur sur la maquette : l'occupation de chaque zone et ses modules se lisent d'un regard. |
| Composants communs (`SectionCard`, `NumberField`, `StatTile`, `Collapsible`) plutôt que des styles au cas par cas | La feuille de style a grossi phase après phase ; factoriser évite les incohérences (tailles de champs, titres, espacements). |
| Conserver tous les `data-testid` existants | Les 208 tests de composants restent la garantie que l'affichage ne casse aucun comportement. |
