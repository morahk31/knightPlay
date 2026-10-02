---
status: done
---

# Instruction: Longbow et arsenal de légende

Demande ajoutée après le plan initial : « il manque un calculateur de dégâts pour le Longbow ainsi que la progression de l'arme de légende ».
Décisions de l'utilisateur : les deux versions du Longbow (livre de base et *Arsenal de légende*), arbres complets avec leurs liens, Silas mis à jour (Longbow avec Chirurgical et Précision).

## Architecture projection

```txt
src
├── data
│   ├── ✅ legend.ts             # 8 châssis + Longbow : profils, optimisations (rareté, coûts successifs, bonus, effets, liens)
│   ├── ✏️ weapons.ts            # pistolet polycalibre, lame polymorphique, Longbow (LdB)
│   └── ✏️ armors.ts             # identifiants des évolutions de la Ranger
├── rules
│   ├── ✅ legend.ts             # disponibilité dans l'arbre (liens), profil optimisé, contrôle d'achat
│   ├── ✅ longbow.ts            # profil LdB selon les évolutions, coût en PE d'un tir (boost, portée, effets mineurs/intermédiaires/majeurs, économie)
│   ├── ✏️ effects.ts            # effets de l'Arsenal (fatal, sensitif, chirurgical, bourreau, dévastation, régularité, annihilation, excellence, boost…)
│   ├── ✏️ attack.ts             # sensitif, chirurgical, excellence, annihilation, bourreau, dévastation, régularité, exposer, boost, fatal
│   └── ✏️ types.ts              # OwnedWeapon.legende, évolutions possédées
├── stores/characters.ts         # achat de châssis, d'optimisations et d'évolutions de la Ranger (transactions annulables)
└── components
    ├── sheet/✅ LegendTree.vue   # arbre d'optimisations par rareté : acheté / disponible / non relié / rareté insuffisante
    ├── sheet/✏️ WeaponsPanel.vue # section « Arsenal de légende » d'une arme, ajout du Longbow
    ├── sheet/✏️ ArmorPanel.vue   # achat des évolutions de la Ranger
    └── actions/✏️ AttackPanel.vue # section Longbow : PE, boost, portée, effets ; boost et fatal génériques
tests/✅ legend.spec.ts, ✅ longbow.spec.ts
```

## Règles

- Arbre : une optimisation est disponible si elle touche le réseau relié au châssis ou une optimisation achetée (*Arsenal* p. 6) ; rareté 100 / 300 / 500 PG gagnés ; achats répétés au coût indiqué, le moins cher d'abord ; un effet « remplace X » retire l'effet précédent.
- Longbow LdB (p. 157, FAQ 2020 p. 11) : 3D6 / 1D6, +1D6 par PE (6 max), portée +1 cran par PE, 2 PE et 3 PE par effet (3 max par liste) ; évolutions achetées : effets à 6 PE, 5D6 / 3D6 et +9D6, perte de lourd, −2 PE par effet (min. 1).
- Longbow *Arsenal* (p. 23) : Boost 9 (puis 14), portée, effets mineurs, intermédiaires, majeurs (achat), Économie (−2 PE par effet).

## Test acceptance criteria

| Critère |
| --- |
| Les liens de l'arbre bloquent une optimisation non reliée (passage outre possible) ; la rareté exige le total de PG. |
| Le profil optimisé reflète les bonus et effets achetés (dont « remplace X »), et l'annulation restaure l'arme. |
| Un tir de Longbow calcule son coût en PE (avec Économie), refuse si l'énergie manque, et applique dés et effets. |
| Silas est importable avec son Longbow (Chirurgical, Précision). |
