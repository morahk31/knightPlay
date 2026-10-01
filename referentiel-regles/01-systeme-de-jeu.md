# 01 · Système de jeu (système « combo »)

> Sources : [LdB] p. 74-79 (conventions de référence : voir [README](README.md)).

## Le test : base + combo

| Règle | Détail | Source |
|---|---|---|
| Dés | Uniquement des D6. | LdB p. 74 |
| Base | Caractéristique imposée par le MJ selon l'action. | LdB p. 75 |
| Combo | Seconde caractéristique choisie par le joueur et justifiée par la description. **Elle ne peut pas être la même que la base.** | LdB p. 75 |
| Nombre de dés | **Base + combo** (somme des deux scores). | LdB p. 77 |
| Réussite | Chaque **dé pair** (2, 4, 6) = 1 réussite. Les dés impairs sont ignorés. | LdB p. 77 |
| Résultat | Le test est réussi si les réussites **dépassent strictement** la difficulté (ou l'opposition). | LdB p. 76-77 |
| Réussites en trop | Elles ne servent à rien, sauf effet particulier (ex. *assistance à l'attaque*). | LdB p. 77 |
| Retenter | C'est possible, mais la difficulté monte d'un niveau à chaque nouvel essai. | LdB p. 77 |
| PNJ | Pas de caractéristiques : le MJ lance un nombre de dés égal à **un aspect**, sans combo. | LdB p. 74, 78 |

## Overdrives (OD)

- Chaque niveau d'OD d'une caractéristique = **1 réussite automatique** sur tout jet où cette caractéristique est en base **ou** en combo. Le maximum est de 5 par caractéristique.
- Si la base et le combo ont tous deux des OD, **leurs réussites automatiques s'additionnent**.
- Source : LdB p. 77.

## Échec critique et exploit

| Cas | Condition | Effet | Source |
|---|---|---|---|
| **Échec critique** | Aucun dé pair sur le jet. | Échec automatique, **même avec des OD**. Le MJ décrit des conséquences graves. | LdB p. 77-78 |
| **Exploit** | **Tous** les dés sont pairs. | On relance tous les dés une fois et on **ajoute** les nouvelles réussites (les OD ne comptent pas une 2ᵉ fois). Un seul exploit par test. Le MJ peut accorder un petit bonus (ex. *barrage 2*, ou +2 réussites automatiques au prochain test). | LdB p. 78 |

## Difficultés (lors des scènes)

| Niveau | Difficulté |
|---|---|
| Facile | 1 |
| Faisable | 2 |
| Normal | 3 |
| Délicat | 4 |
| Ardu | 5 |
| Difficile | 6 |
| Complexe | 7 |
| Très difficile | 9 |
| Insurmontable | 12 |
| Impossible | 15 |

Le MJ peut monter ou baisser la difficulté d'un ou deux niveaux selon la qualité du combo et de la description, ou selon la situation : aide en arrière-plan, calme, bons outils, stress, danger, météo, PNJ gênants… Un combo illogique est un échec automatique. Source : LdB p. 76.

## Opposition (lors des phases de conflit)

- Il n'y a pas de difficulté fixée : le score à dépasser est un **score d'opposition**.
- Lors d'une attaque, l'opposition est la **défense** de la cible au contact, ou sa **réaction** au tir.
- PJ contre PJ : le MJ choisit la caractéristique adverse qui sert d'opposition (ex. Déplacement pour une poursuite, Perception contre la Discrétion).
- PJ contre PNJ : opposition = **aspect du PNJ ÷ 2** (arrondi à l'inférieur) **+ score de l'aspect exceptionnel** correspondant.
- Seul celui qui agit lance les dés. Celui qui subit n'oppose qu'un score.
- Source : LdB p. 76-77.

## Entraide

- Avant le jet, jusqu'à **3 aidants** maximum.
- Chaque aidant lance un nombre de dés égal à **une seule caractéristique**. Elle doit être différente de celles du jet aidé et de celles des autres aidants.
- Leurs réussites **s'ajoutent** à celles du PJ aidé. Les OD des aidants ne comptent pas, et les aidants ne font ni exploit ni échec critique.
- Un PNJ aidant lance un nombre de dés égal à **aspect ÷ 2**.
- Le MJ peut augmenter la difficulté de 1 à 3 niveaux si les aidants se gênent.
- Source : LdB p. 78-79.

## Règle optionnelle : sacrifier des dés

- On met des dés de côté **par paires** : 2 dés sacrifiés = 1 réussite automatique.
- Le MJ peut l'interdire. On ne gagne **jamais** d'héroïsme sur un jet où l'on a sacrifié des dés.
- Source : LdB p. 77.

## Ordre des calculs

- On fait d'abord les divisions, ensuite les soustractions (et de même : multiplications d'abord, additions ensuite).
- Toutes les divisions sont **arrondies à l'inférieur**.
- Deux multiplications successives ne multiplient que la valeur de départ : « doubler puis doubler » revient à **tripler**.
- Exemple : défense 16, point faible (÷2), barrage 2 et lumière 4 → 16/2 − 2 − 4 = **2**.
- Source : LdB p. 91.

## Pour l'outil KnightPlay

- `dés = base + combo + modificateurs` (styles, espoir < 10, manœuvrabilité…). Si on tombe à 0 dé, le test est un échec automatique.
- `réussites = dés pairs + OD(base) + OD(combo) + bonus`.
- Afficher les cas **échec critique** (0 dé pair) et **exploit** (tous pairs, relance).
- Probabilité de réussite : `P(X > difficulté − réussites auto)`, avec X ~ Binomiale(n, ½).
