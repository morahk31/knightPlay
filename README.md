# KnightPlay

Feuille de personnage et calculateur d'actions pour le jeu de rôle **Knight**. Outil local, pour un joueur, sur PC.

## Utiliser l'outil

- **Sans installation :** ouvrez `dist/index.html` par double-clic, après un build. Le fichier est autonome : il contient tout le JavaScript et le CSS.
- **Sauvegarde :** les personnages sont sauvegardés automatiquement dans le navigateur. Utilisez **Exporter** pour en garder une copie (`*.knightplay.json`) et **Importer** pour la recharger, par exemple sur un autre navigateur.

## Développer

Prérequis : Node.js 20 ou plus.

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires et de composants (Vitest)
npm run typecheck  # vérification TypeScript (vue-tsc)
npm run build      # produit dist/index.html (fichier unique)
```

## Organisation

| Dossier | Rôle |
|---|---|
| `src/rules/` | Moteur de règles en TypeScript pur, testable. Chaque fonction reçoit la configuration `RulesConfig` en paramètre. |
| `src/config/` | Valeurs de règles par défaut, issues du référentiel et surchargeables |
| `src/stores/` | État (Pinia) et persistance locale |
| `src/services/` | Export et import de fichiers |
| `src/components/` | Interface (Vue 3) |
| `tests/` | Tests Vitest |
| `referentiel-regles/` | Référentiel des règles de Knight (voir son `README.md`) |
| `aidd_docs/tasks/` | Brainstorm, plan et phases du projet |
