---
status: done
---

# Instruction: Page récapitulative de partie

Demande : « une page récapitulative permettant d'avoir toutes les informations pour que le joueur puisse avoir un bon déroulement d'une partie de Knight », stylisée pour que les informations importantes soient très visibles.

## Architecture projection

```txt
src
├── data/✅ overdrives.ts        # effets des OD par niveau (fiche 09, LdB p. 442-446)
├── rules/✅ recap.ts            # synthèse calculée : alertes, défenses, jets d'attaque prêts, dégâts, capacités, OD actifs
├── components/✅ RecapView.vue  # page « Récap » lisible d'un coup d'œil, imprimable
├── components/✏️ TopBar.vue     # bouton « Récap »
├── App.vue                      # vue fiche / récap / règles
└── styles/base.css              # styles de la page et impression
tests/✅ recap.spec.ts
```

## Contenu

1. Identité, armure et état, style, motivation majeure.
2. Alertes : désespoir (espoir sous le seuil), agonie, armure repliée, plus d'énergie (OD et modules inactifs), nods épuisés.
3. Jauges en grand : PS, PA (Guardian), PE, espoir, héroïsme ; CdF ; nods restants.
4. Défense, réaction, initiative (style compris).
5. Attaques prêtes : dés pour toucher (base + meilleur combo + OD), dégâts et violence calculés, portée, effets avec description.
6. Capacités de l'armure et modules : coût en PE, activation, durée, effet.
7. Aspects, caractéristiques et overdrives actifs avec leurs effets débloqués.
8. Avantages, inconvénients et motivations.
9. Rappels de règles : difficultés, portées, héroïsme, encaissement, échec critique et exploit, nods.

## Test acceptance criteria

| Critère |
| --- |
| Les valeurs affichées sont celles des moteurs de règles (défense, dégâts, PE). |
| Les alertes apparaissent selon l'état (désespoir, agonie, armure repliée, 0 PE). |
| La page s'imprime proprement (barre d'actions masquée, fond clair). |
