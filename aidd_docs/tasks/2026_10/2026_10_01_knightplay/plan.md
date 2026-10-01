---
objective: "Un joueur peut créer, mettre à jour et utiliser en partie, sur PC, la fiche de son chevalier Knight. L'outil calcule tests, attaques, encaissement, énergie et progression selon des règles préremplies et modifiables."
status: in-progress
---

# Plan: KnightPlay — fiche de personnage et calculateur d'actions *Knight*

## Overview

| Field      | Value |
| ---------- | ----- |
| **Goal**   | Application web locale (Vite, TypeScript, Vue 3) : fiche de chevalier, panneau d'actions en partie (tests, attaques, encaisser, modules et énergie), progression PX et PG entre les parties, règles maison modifiables. |
| **Source** | `aidd_docs/tasks/2026_10/2026_10_01_knightplay/brainstorm.md` et `referentiel-regles/` (README et fiches 01-13). Décision de l'utilisateur : les points à vérifier et les contradictions deviennent des **paramètres modifiables**. |

## Phases

| #   | Phase | File |
| --- | ----- | ---- |
| 1   | Socle : projet, persistance, gestion des personnages, import et export | [`phase-1.md`](./phase-1.md) |
| 2   | Fiche personnage : identité, aspects et caractéristiques, valeurs dérivées, jauges | [`phase-2.md`](./phase-2.md) |
| 3   | Moteur de dés et test de caractéristique (dés virtuels ou réels) et journal | [`phase-3.md`](./phase-3.md) |
| 4   | Méta-armure, modules et énergie | [`phase-4.md`](./phase-4.md) |
| 5   | Armes, effets et action d'attaque | [`phase-5.md`](./phase-5.md) |
| 6   | Encaisser les dégâts | [`phase-6.md`](./phase-6.md) |
| 7   | Progression entre les parties : PX, PG et historique | [`phase-7.md`](./phase-7.md) |
| 8   | Règles maison : écran des paramètres et catalogues modifiables | [`phase-8.md`](./phase-8.md) |

## Resources

| Source | Verified |
| ------ | -------- |
| https://vite.dev/guide/ | Le modèle `vue-ts` de Vite donne Vue 3 et TypeScript, avec `npm run dev` et `build`. |
| https://pinia.vuejs.org/ | Store officiel de Vue 3. Persistance possible avec un `watch` profond vers `localStorage`, sans plugin. |
| https://vitest.dev/ | Tests unitaires du moteur de règles en TypeScript pur, et tests de composants avec `@vue/test-utils` et `jsdom`. |
| https://github.com/richardtallent/vite-plugin-singlefile | Le build est un seul `index.html` avec le JS et le CSS intégrés, ouvrable par double-clic (`file://` bloque les scripts `type=module` externes). |
| `referentiel-regles/README.md` | Liste des règles, priorité des sources, et 8 « points à vérifier » qui deviennent des paramètres. |

## Decisions

| Decision | Why |
| -------- | --- |
| Vite + TypeScript + Vue 3 + Pinia + Vitest | Choix de l'utilisateur. UI réactive riche en formulaires. Le typage sécurise le moteur de règles. |
| **Moteur de règles en TypeScript pur** (`src/rules/`), sans dépendance à Vue | Testable de façon unitaire et réutilisable. L'UI ne fait qu'appeler des fonctions pures. |
| **Toutes les valeurs de règles viennent d'un objet `RulesConfig`** (valeurs par défaut issues du référentiel, surchargeables) | Exigence du brainstorm (« préremplis, modifiables ») et décision de l'utilisateur sur les points contradictoires. |
| **Catalogues de données en TypeScript ou JSON versionnés** (`src/data/`), avec des entrées personnalisées par personnage | Les profils d'armures, d'armes et de modules sont préremplis, et le joueur peut ajouter ou corriger les siens. |
| Persistance `localStorage`, plus export et import d'un fichier JSON par personnage | Usage solo sur PC, sans compte ni serveur (supposition validée dans le brainstorm). |
| Build `vite-plugin-singlefile` | L'outil s'ouvre en double-cliquant sur un fichier, sans serveur. |
| Le personnage stocke des **valeurs saisies** et des **valeurs calculées surchargeables** (`override`) | Le joueur garde la main si une règle maison diffère. |
