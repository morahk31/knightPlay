# KnightPlay — compagnon de jeu pour le JdR *Knight*

Un outil web qui s'utilise sur PC, pour un seul joueur et son chevalier. **Pendant la partie**, il affiche la fiche complète à côté d'un panneau d'actions. Il dit quoi lancer, avec quelles chances de réussir, puis lance les dés à la place du joueur ou prend ses vrais résultats, et met la fiche à jour. **Entre les parties**, il sert à faire progresser le personnage en dépensant les PX et PG gagnés, avec des coûts préremplis d'après les règles mais modifiables. Le MJ n'a pas d'accès dans cette version.

## Ce qui est décidé

- La fiche contient les 5 Aspects (Chair, Bête, Machine, Dame, Masque), les 15 caractéristiques, les OD de la méta-armure, les jauges (Santé, Armure, Énergie, Espoir, Héroïsme), les armes et les modules.
- Les quatre actions de la première version :
  - **Tests de caractéristique** : nombre de dés, réussites automatiques, probabilité de réussir.
  - **Attaques** : toucher ou non, puis dégâts et violence.
  - **Encaisser** : champ de force, puis armure, puis santé.
  - **Modules** : activation et décompte de l'énergie.
- **Deux façons de lancer les dés** : l'outil lance pour le joueur, ou le joueur saisit le résultat de ses vrais dés.
- **Progression** : les PX et PG gagnés et dépensés sont suivis avec un historique. Les coûts sont préremplis et modifiables (règles maison possibles).
- L'outil est pensé pour un écran de PC, donc tout reste visible en même temps.
- Les règles viennent des livres de *Knight* : seuls les chiffres et les mécaniques sont repris, pas le texte du livre.

## Encore ouvert

- **Supposition** : les données restent sur le PC, avec un export et un import de fichier pour sauvegarder (pas de compte, pas de synchronisation entre appareils).
- **Supposition** : on peut gérer plusieurs personnages, mais un seul est actif à la fois.
- Les règles exactes (coûts, formules, Exploit, échec critique) seront confirmées à la lecture des règles.
- **Reporté** : la vue MJ et le partage avec la table.

## Prochaine étape

Extraire les règles utiles dans un fichier de référence à vérifier, puis définir le découpage du travail avant de coder.
