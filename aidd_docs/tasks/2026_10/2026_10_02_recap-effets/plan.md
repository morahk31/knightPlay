---
objective: "La page Récap affiche, sans survol, la description de chaque effet porté par les attaques du personnage."
status: implemented
---

# Plan: Description des effets sur la page Récap

## Overview

| Field      | Value |
| ---------- | ----- |
| **Goal**   | Ajouter à la page Récap un lexique des effets des armes du personnage (choc, perce armure, ultraviolence…), avec leur description. |
| **Source** | Demande de l'utilisateur : « sur la page de recap, je voudrais avoir la description des différents effets (ex : choc, perce armure, ultraviolence, ...) » |

## Phases

| #   | Phase                                | File                         |
| --- | ------------------------------------ | ---------------------------- |
| 1   | Calcul du lexique des effets         | [`phase-1.md`](./phase-1.md) |
| 2   | Section « Effets » sur la page Récap | [`phase-2.md`](./phase-2.md) |

## Decisions

| Decision | Why |
| -------- | --- |
| Un lexique unique sous les attaques, un effet par ligne, plutôt que la description répétée dans chaque carte d'attaque | Un même effet (ex. meurtrier) peut être porté par plusieurs armes ; une liste dédupliquée reste lisible et imprimable. Les infobulles des cartes restent en place. |
| Les descriptions viennent de `effectDescription` (catalogue de base + effets personnalisés) | Une seule source de vérité : un effet modifié ou ajouté en règle maison s'affiche tel quel dans le Récap. |
| Repère « calculé » pour les effets que l'outil applique déjà dans Attaquer (`EffectDef.calcule`) | Le joueur sait ce qu'il doit gérer lui-même à la table et ce que l'outil fait pour lui. |
