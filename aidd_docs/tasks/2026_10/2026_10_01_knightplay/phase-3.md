---
status: done
---

# Instruction: Moteur de dés et test de caractéristique (dés virtuels ou réels) et journal

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
└── src
    ├── rules
    │   ├── ✅ dice.ts               # rollD6 (RNG injectable), countSuccesses, binomial P(X > k), probabilité de réussite avec réussites auto
    │   └── ✅ test.ts               # resolveTest : pool = base + combo (+ 3ᵉ caractéristique) + modificateurs − malus d'espoir ; auto = OD ; échec critique, exploit (relance), difficulté
    ├── ✏️ config/defaultRules.ts    # seuil de désespoir (10), table des difficultés, option « sacrifier des dés », relance exploit
    ├── stores
    │   └── ✅ log.ts                # journal des jets (persisté par personnage, limite de taille)
    └── components
        ├── actions
        │   ├── ✅ TestPanel.vue     # base, combo, 3ᵉ caractéristique (héroïsme), dés ±, réussites auto ±, difficulté (liste ou nombre), aperçu de probabilité
        │   ├── ✅ DiceModeToggle.vue # « L'outil lance » ou « J'ai lancé » (saisie du nombre de réussites, ou des faces)
        │   └── ✅ RollResult.vue    # dés affichés, réussites, OD, total, réussi ou raté, échec critique, exploit
        └── ✅ LogPanel.vue
└── tests
    ├── ✅ dice.spec.ts
    └── ✅ test.spec.ts
```

## User Journey

```mermaid
flowchart TD
  A[Panneau Test] --> B[Choisit base et combo, éventuellement via clic sur la fiche]
  B --> C[Aperçu : X dés + Y réussites auto, Z % de réussite]
  C --> D{Mode de dés}
  D -- L'outil lance --> E[Jet virtuel]
  D -- J'ai lancé --> F[Saisie : réussites aux dés, ou faces]
  E --> G[Résultat : total, réussite, échec critique ou exploit]
  F --> G
  G --> H[Entrée ajoutée au journal]
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    RNG injectée avec des faces fixes => jets déterministes: 5: system
  section Happy path
    Déplacement 4 + Force 3, OD 2 + 1, faces 3 pairs sur 7 => 6 réussites: 5: system
    Difficulté 5 et 6 réussites => test réussi (dépasser, pas égaler): 5: system
    7 dés et 3 auto contre difficulté 5 => probabilité affichée égale à P(X ≥ 3) avec X ~ B(7, ½): 5: system
    Mode « J'ai lancé », 2 réussites saisies, 1 OD, difficulté 2 => réussi et journalisé: 5: browser
  section Edge case - échec critique
    0 dé pair avec des OD => résoudre => échec critique, raté malgré les OD: 1: system
  section Edge case - exploit
    Tous les dés pairs => résoudre => relance ajoutée, OD comptés une seule fois: 1: system
  section Edge case - désespoir
    Espoir à 8, pool de 8 => résoudre => pool réduit à 6 dés: 1: system
  section Edge case - pool nul
    Pool réduit à 0 => résoudre => échec automatique: 1: system
```

## Wireframe

```txt
┌──────────────────────────────┐
│ (1) Test                     │
│ Base [Combat ▼] Combo [Force▼]│
│ +3ᵉ carac (héroïsme) [— ▼]   │
│ Dés ± [0]  Réussites ± [0]   │
│ Difficulté [Normal (3) ▼]    │
│ (2) 7 dés + 2 auto · 77 %    │
│ (3) (•) L'outil lance        │
│     ( ) J'ai lancé : [__]    │
│ [ Lancer ]                   │
├──────────────────────────────┤
│ (4) ⚄ ⚃ ⚀ ⚅ ⚁ ⚂ ⚃ → 4 + 2 = 6 │
│     RÉUSSI (> 3)             │
└──────────────────────────────┘
```

1. Choix du combo et des modificateurs.
2. Aperçu du nombre de dés, des réussites automatiques et de la probabilité.
3. Mode de dés : virtuel ou saisie manuelle.
4. Résultat détaillé, ensuite copié dans le journal.

## Tasks to do

### `1)` Moteur de dés

> Avoir des jets et des probabilités exacts et testables.

1. `rollD6(n, rng)` avec une RNG injectable. `successes(faces)` compte les dés pairs.
2. `chanceToBeat(dice, auto, difficulty)` = P(réussites aux dés + auto > difficulté).

### `2)` Résolution d'un test

> Appliquer le système combo du référentiel (fiche 01).

1. Pool = base + combo + 3ᵉ caractéristique éventuelle + modificateurs − max(0, seuil − espoir actuel).
2. Réussites automatiques = OD de chaque caractéristique utilisée (3ᵉ comprise) + bonus.
3. Échec critique : 0 dé pair (et pool > 0), échec même avec des OD. Exploit : tous les dés pairs, une relance ajoutée (sans OD), une seule fois. Pool à 0 : échec automatique.
4. Mode manuel : on saisit soit le nombre de réussites, soit les faces. Avec seulement un nombre, l'utilisateur coche lui-même « échec critique » ou « exploit ».

### `3)` Interface et journal

> Lancer un test en quelques clics et en garder la trace.

1. `TestPanel` (pré-sélection de la base via clic sur une caractéristique de la fiche), `DiceModeToggle`, `RollResult`.
2. Store `log` et `LogPanel` : horodatage, type, détail, résultat. Bouton « Vider ».

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | Pour des faces données, les réussites sont exactes. La probabilité affichée correspond à la loi binomiale avec les réussites automatiques. |
| 2 | Échec critique, exploit, malus d'espoir sous 10 et pool à 0 se comportent comme dans le référentiel (fiche 01, fiche 05). |
| 3 | Un test est lancé ou saisi en 3 clics au plus après le choix du combo. Chaque résultat apparaît dans le journal et survit au rechargement. |
