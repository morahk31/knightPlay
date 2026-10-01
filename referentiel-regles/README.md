# Référentiel des règles de *Knight* (pour KnightPlay)

Ce répertoire classe les règles de *Knight* (livre de base, suppléments, codex et aides de jeu), pour **retrouver vite une règle** et **préremplir l'outil**.
Les règles sont **résumées et chiffrées**, le texte du livre n'est pas recopié. Pour le détail, chaque ligne renvoie à sa source et à sa page.

## Conventions

- **Références** : `LdB p. 77` = livre de base, page 77 (à une page près selon l'édition). Les abréviations des sources sont dans [00 · Sources](00-sources.md).
- **Priorité des sources** en cas de contradiction :
  1. **FAQ-2020** ;
  2. livre de base v1.5 ;
  3. suppléments officiels (2038, codex) ;
  4. aides optionnelles (Arsenal de légende, *Atlas*) ;
  5. fan-made, signalé par ⚠️.
- **⚠️ À vérifier** : une valeur extraite d'un tableau graphique ou une contradiction entre sources. La liste complète est plus bas.
- Dans l'outil, toutes ces valeurs servent de **valeurs par défaut modifiables** (décision du brainstorm).

## Organisation par catégorie

| # | Fichier | Contenu |
|---|---|---|
| 00 | [Sources](00-sources.md) | Catalogue des ouvrages : statut, utilité, contenu, ce qui manque |
| 01 | [Système de jeu](01-systeme-de-jeu.md) | Test base + combo, réussites, OD, échec critique, exploit, difficultés, opposition, entraide, sacrifice de dés |
| 02 | [Création du personnage](02-creation-personnage.md) | Aspects et caractéristiques, les 10 étapes, archétypes, lames du tarot, hauts faits, blasons, motivations, sections, **valeurs dérivées** |
| 03 | [Combat](03-combat.md) | Scène et phase de conflit, actions, initiative, embuscade, surprise, défense et réaction, **styles de combat**, point faible |
| 04 | [Blessures et dégâts](04-blessures-degats.md) | PS, agonie, tableau des blessures, soins, implants, chutes, feu, poisons, armes improvisées, destruction du décor |
| 05 | [Espoir et héroïsme](05-espoir-heroisme.md) | Espoir et désespoir, points d'héroïsme, mode héroïque, contacts, cartes du destin |
| 06 | [Méta-armures](06-meta-armures.md) | CdF, PA, PE, Guardian, **ordre d'encaissement**, statistiques et capacités des 9 armures du livre de base |
| 07 | [Progression PX et PG](07-progression-px-pg.md) | Gains en fin de mission, **coûts en PX**, paliers de PG, total gagné ou solde disponible |
| 08 | [Armes et effets](08-armes-effets.md) | Règles de l'arsenal, nods, **liste des effets**, grenades, armes standards, avancées et rares, améliorations, **formule de dégâts** |
| 09 | [Modules et overdrives](09-modules-overdrives.md) | Tous les modules du livre de base (PG, slots, PE, activation), **coûts et bonus des OD** |
| 10 | [PNJ et bestiaire](10-pnj-bestiaire.md) | Aspects exceptionnels, types de PNJ (bande, colosse…), capacités (peur, domination, Anathème…) |
| 11 | [FAQ et errata](11-faq-errata.md) | Corrections officielles et précisions (FAQ 2020, 2019, 2018) |
| 12 | [Véhicules](12-vehicules.md) | Manœuvrabilité, vitesse, poursuites, combat contre un véhicule, profils |
| 13 | [Suppléments](13-supplements.md) | 2038 (armures de 3ᵉ et 4ᵉ génération, prestige, Avalon), codex (Druid, Forge, Art, capacités héroïques…), Arsenal de légende, livret 2020, cartes, fan-made |

## Index thématique

| Je cherche… | Fiche |
|---|---|
| Combien de dés lancer, qu'est-ce qu'une réussite | [01](01-systeme-de-jeu.md) |
| Les niveaux de difficulté | [01](01-systeme-de-jeu.md) |
| Échec critique, exploit | [01](01-systeme-de-jeu.md) |
| Overdrives (réussites automatiques) | [01](01-systeme-de-jeu.md) ; bonus et coûts : [09](09-modules-overdrives.md) |
| Entraide | [01](01-systeme-de-jeu.md) |
| Calculer Défense, Réaction, Initiative, PS, Espoir, Contacts | [02](02-creation-personnage.md) (étape 9) |
| Archétype, lames du tarot, avantages et inconvénients, haut fait, blason, section | [02](02-creation-personnage.md) |
| Capacités héroïques achetées en PX | [13](13-supplements.md) (codex 1) |
| Initiative, actions par tour, embuscade | [03](03-combat.md) |
| Styles de combat (agressif, akimbo…) | [03](03-combat.md) ; 4 styles de 2020 : [13](13-supplements.md) |
| Toucher une cible, point faible | [03](03-combat.md) |
| Cible invisible | [11](11-faq-errata.md) |
| Ordre CdF puis PA puis PS, −1 PS par tranche de 5 PA | [06](06-meta-armures.md), [11](11-faq-errata.md) |
| Combinaison Guardian | [06](06-meta-armures.md), [11](11-faq-errata.md) |
| Agonie, blessures aléatoires, soins, nods | [04](04-blessures-degats.md), [08](08-armes-effets.md) |
| Espoir sous 10, chevalier noir, motivations | [05](05-espoir-heroisme.md), [02](02-creation-personnage.md) |
| Points d'héroïsme, mode héroïque | [05](05-espoir-heroisme.md) |
| Capacités d'une méta-armure (Ghost, Shrine, Goliath…) | [06](06-meta-armures.md) ; Psion, Monk, Sorcerer, Necromancer, Druid… : [13](13-supplements.md) |
| Énergie : recharge, coûts | [06](06-meta-armures.md), [09](09-modules-overdrives.md) |
| Profil d'une arme | [08](08-armes-effets.md) ; 2038 et codex 4 : [13](13-supplements.md) |
| Effet d'arme (meurtrier, lesté, perce armure…) | [08](08-armes-effets.md) ; ténébricide, espérance, oblitération, fatal… : [13](13-supplements.md) |
| Calcul des dégâts (Force, OD de Force, lesté, orfèvrerie…) | [08](08-armes-effets.md), [11](11-faq-errata.md) |
| Profil d'un module | [09](09-modules-overdrives.md) ; prestige et codex 4 : [13](13-supplements.md) |
| Coûts en PX, gain de PX et PG, paliers de l'arsenal | [07](07-progression-px-pg.md) |
| Évolutions d'armure (150, 200, 250 PG) | [06](06-meta-armures.md) |
| Bandes, colosses, aspects exceptionnels des ennemis | [10](10-pnj-bestiaire.md) |
| Peur, désespérant, domination, Anathème | [10](10-pnj-bestiaire.md) |
| Véhicules, moto steed | [12](12-vehicules.md) |
| Table Ronde, modules et armes de prestige, Avalon | [13](13-supplements.md) |
| Forge, améliorations d'armes de contact | [13](13-supplements.md) (codex 5) |
| Améliorations d'armes à distance | [08](08-armes-effets.md) (standards selon la FAQ 2020) |

## Points à vérifier dans les règles

1. **Slots et OD de base des armures** : extraits de schémas graphiques (LdB p. 135-167 ; 2038 p. 9-21). L'ordre des zones est supposé être tête / bras G / bras D / torse / jambe G / jambe D.
2. **Profils des véhicules** : l'ordre PA / PE / CdF est supposé (LdB p. 447-450).
3. **Akimbo** : la moitié de la violence est arrondie à l'inférieur (LdB p. 88) ou au supérieur (LdB p. 89 et livret). Contradiction interne.
4. **Borealis, attaque de plasma** : 2 PE (LdB) ou **1 PE** (FAQ-2020).
5. **Casser une arme** : 7 / 9 / 12 (LdB) ou **5 / 7 / 12** (FAQ-2020).
6. **Mode héroïque** : réussites en trop ajoutées en **points** (LdB) ou en **D6** (livret 2020).
7. **Coûts illisibles** (dans des images) : PG des modules de prestige (2038), coût en héroïsme des capacités héroïques (codex 1), statistiques de Shaman, Warlock et Berserk (cartes).
8. Les règles de l'**Atlas** (*La Geste de la fin des temps*) ne sont pas couvertes par ce référentiel : égide, traumas, résilience, capacités ultimes, méta-armure de légende.

## Ce que l'outil KnightPlay utilisera en priorité

- **Calculs** :
  - jet `base + combo + modificateurs` (styles, espoir sous 10) ;
  - réussites automatiques des OD ;
  - échec critique et exploit ;
  - probabilité de dépasser la difficulté ([01](01-systeme-de-jeu.md)).
- **Attaque** : toucher face à la défense ou la réaction (styles, point faible), puis dégâts et violence avec les bonus ([03](03-combat.md), [08](08-armes-effets.md)).
- **Encaisser** : CdF, puis PA (−1 PS par tranche de 5), puis Guardian, puis PS, avec les effets *ignore CdF*, *ignore armure*, *pénétrant*, *perce armure* ([06](06-meta-armures.md), [11](11-faq-errata.md)).
- **Modules et énergie** : coût en PE, action, durée ([06](06-meta-armures.md), [09](09-modules-overdrives.md)).
- **Progression** :
  - coûts en PX : aspect = nouveau score × 5, caractéristique = nouveau score × 2 ;
  - OD = 10 / 30 / 50 / 70 / 100 PG ;
  - paliers d'arsenal 100 / 300 / 500 PG gagnés ([07](07-progression-px-pg.md), [09](09-modules-overdrives.md)).
