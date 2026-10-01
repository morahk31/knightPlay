# 06 · Méta-armures

> Sources : [LdB] p. 130-170. D'autres armures et capacités se trouvent dans les suppléments et codex (voir [13 · Suppléments](13-supplements.md)) et dans les [Cartes armures].
> ⚠️ Les blocs de statistiques sont extraits de tableaux graphiques. **Vérifiez l'ordre des slots et des OD** sur la fiche officielle (LdB p. 135, 139, 143, 147, 151, 155, 159, 163, 167).

## Règles générales

| Élément | Règle | Source |
|---|---|---|
| **Champ de force (CdF)** | Se **soustrait à chaque attaque** subie. Si le résultat tombe à 0, il n'y a pas de dégâts. Ignoré par *ignore CdF* et *pénétrant X*. | LdB p. 131 |
| **Points d'armure (PA)** | Encaissent les dégâts **avant** les PS. Par tranche **complète de 5 dégâts sur les PA, −1 PS** (sans CdF). Ignorés par *ignore armure* et *perce armure X* (les dégâts vont alors directement aux PS). | LdB p. 131 |
| PA à 0 | L'armure se **replie** (« folde ») automatiquement. Le personnage passe en combinaison Guardian jusqu'à réparation (nod d'armure ou technicien). Le CdF de l'armure est perdu. | LdB p. 131 |
| Recharge des PA | Nods d'armure, capacités, modules, ou au retour à Camelot (recharge totale). | LdB p. 131 |
| **Points d'énergie (PE)** | Servent aux modules, aux capacités et à certaines armes. **À 0 PE : plus de modules ni d'OD.** | LdB p. 131 |
| Recharge des PE | Nods d'énergie. **+6 PE par heure** de repos (sans module, sans OD, hors combat). Recharge **totale** après 6 h repliée. | LdB p. 131 |
| **Overdrives** | 5 niveaux maximum par caractéristique (sauf Warrior). Coûtent des PG, sans slot, sans PE, sans action. Ne marchent qu'en armure complète. | LdB p. 130 |
| **Slots** | 6 zones : tête, bras gauche, bras droit, torse, jambe gauche, jambe droite. Les modules ne se changent **qu'à Camelot**. | LdB p. 130 |
| **Évolutions** | Débloquées par le **total de PG gagné** (150, 200 et 250 PG), sauf pour la Ranger où elles s'achètent. | LdB p. 131 |
| **Combinaison Guardian** | **5 PA, CdF 5**. Pas de module, de capacité ni d'OD. Son CdF reste actif même à 0 PA. | LdB p. 133 |
| Déploiement de l'armure | 1 tour (3 à 6 s). | LdB p. 133 |
| Rack | **5 armes** maximum. Dégainer ou rengainer = 1 action de déplacement. | LdB p. 133 |
| Pack | 40 kg. | LdB p. 133 |
| Lampes UV | Effet *lumière 1* sur une créature de l'Anathème au contact. | LdB p. 134 |

## Ordre d'encaissement (pour l'outil)

```
dégâts reçus
  − CdF (sauf ignore CdF / pénétrant ; + bonus Shrine, impulsions…)
  → si ignore armure / perce armure : directement aux PS
  → sinon : retirés des PA ; pour chaque tranche complète de 5 retirée des PA : −1 PS
       (sauf avantage *Infatigable*)
  → quand les PA sont à 0 : le reste va aux PS ; l'armure se replie
PS à 0 → agonie (voir 04 · Blessures)
```

> **Excédent quand les PA tombent à 0 :** le livre dit que le reste touche la santé (LdB p. 413), mais la **FAQ 2020 corrige** : l'armure se replie et **le reste va aux 5 PA de la combinaison Guardian**. Le CdF de la Guardian ne s'applique pas sur cette même attaque, sauf décision du MJ. Ensuite seulement, les dégâts vont aux PS. Voir [11 · FAQ et errata](11-faq-errata.md).
> Le −1 PS par tranche de 5 PA se calcule **attaque par attaque**, après le CdF (FAQ-2020 p. 6).
> Bonus de CdF multiples : son CdF + **le plus gros bonus seulement** (FAQ-2020 p. 10).

## Statistiques des 9 méta-armures

| Armure | Gén. | PA | PE | CdF | OD de base (niveau 1) | Slots (tête / bras G / bras D / torse / jambe G / jambe D) | Source |
|---|---|---|---|---|---|---|---|
| **Warrior** | 1 | 100 | 40 | 8 | Combat, Déplacement, Tir, Dextérité | 7 / 10 / 10 / 12 / 7 / 7 | LdB p. 135 |
| **Paladin** | 1 | 120 | 20 | 8 | Force, Endurance, Tir, Perception | 7 / 7 / 7 / 10 / 7 / 7 | LdB p. 139 |
| **Priest** | 1 | 70 | 60 | 10 | Force, Endurance, Savoir, Technique | 5 / 5 / 5 / 8 / 5 / 5 | LdB p. 143 |
| **Warmaster** | 1 | 90 | 50 | 8 | Force, Endurance, Aura, Sang-froid | 5 / 5 / 5 / 8 / 5 / 5 | LdB p. 147 |
| **Rogue** | 2 | 50 | 70 | 12 | Déplacement, Dextérité, Discrétion, Combat | 5 / 5 / 5 / 8 / 5 / 5 | LdB p. 151 |
| **Ranger** | 2 | 50 | 70 | 12 | Déplacement, Dextérité, Discrétion, Tir | 4 / 4 / 4 / 6 / 4 / 4 | LdB p. 155 |
| **Bard** | 2 | 40 | 80 | 12 | Déplacement, Dextérité, Parole, Aura | 5 / 5 / 5 / 8 / 5 / 5 | LdB p. 159 |
| **Wizard** | 3 | 40 | 80 | 14 | Sang-froid, Instinct, Combat, Aura | 5 / 5 / 5 / 8 / 5 / 5 | LdB p. 163 |
| **Barbarian** | 2 | 60 | 60 | 12 | Force, Endurance, Combat, Hargne | 5 / 5 / 5 / 8 / 5 / 5 | LdB p. 167 |

## Capacités par armure

### Warrior : les « types » (LdB p. 137)

- On choisit **3 types** à la création. Chaque type donne **+1 OD dans les 3 caractéristiques** de son aspect, et ces OD ne comptent pas dans la limite de 5.
- Soldier = Chair, Hunter = Bête, Scholar = Machine, Herald = Dame, Scout = Masque.
- Un seul type actif à la fois, un seul changement par tour.
- Coût : **1 PE par tour** en conflit, ou **6 PE par scène** hors conflit. Activation : action de déplacement.
- Évolutions :
  - **150 PG** : l'activation ne coûte plus d'action.
  - **200 PG** : tous les types.
  - **250 PG** : chaque type donne **2 OD** par caractéristique.

### Paladin (LdB p. 141)

- **Champ de force Shrine** : dôme de 6 m qui donne **+6 CdF** à ceux qui sont dedans. Pour y entrer, il faut Force 5 ou Chair 10. Coût : **1 PE par tour** (2 à portée moyenne). Aucune action. Le bonus est ignoré par *ignore CdF*.
- **Mode Watchtower** : immobile, **réaction ÷ 2**, et **+1 action de combat de tir** par tour (1 PE par tir supplémentaire). Activation : 2 PE et 1 action de déplacement.
- **Lente et lourde** : pas de modules de course, de saut ni de déplacement silencieux. Difficulté **+1 niveau** en Discrétion et Déplacement.
- Évolutions :
  - **150 PG** : armes de tir slotées sur les bras.
  - **200 PG** : Shrine à **+8 CdF**, sur soi (5 PE pour 6 tours) ou à portée moyenne (10 PE).
  - **250 PG** : plus de « lente et lourde ».

### Priest (LdB p. 145)

- **Mode nanoC** : construction de 3 m³ (forme simple), 2 m³ (objet détaillé) ou 1 m³ (objet mécanique). Test base Technique. Coût : **3, 6 ou 9 PE**. Durée 1 min (+2 PE par minute).
- **Mode Mechanic** : réparation au contact **3D6+6 PA** (4 PE), ou à distance (portée longue) **2D6+6 PA** (6 PE). Activation : action de déplacement.
- Évolutions :
  - **150 PG** : les constructions durent 1 h (+2 PE par heure).
  - **200 PG** : Mechanic +1D6+6.
  - **250 PG** : création de véhicules (9 PE pour 1 h).

### Warmaster (LdB p. 148-149)

- **Mode Warlord (impulsions)** : 3 impulsions au départ, portée lointaine, 1 action de déplacement chacune. Se cibler soi-même coûte **½ du coût de base** (arrondi au supérieur). Prolonger coûte ½ du coût total (minimum 1).

| Impulsion | Effet | Coût en PE |
|---|---|---|
| Action | +1 action (de combat ou de déplacement) au prochain tour d'un allié | 4. Sur soi : **10** (FAQ-2020). Ne se prolonge pas. |
| Esquive | +2 en défense et en réaction | 3 par allié (+2 par tour pour prolonger) |
| Force | +2 en CdF | 2 par allié (+1 par tour) |
| Guerre | +1D6 aux dégâts et à la violence | 1 par allié (+1 par tour) |
| Énergie | Donne de 1 à 5 PE à un allié | 1 à 5 |

- **Mode Falcon** : révèle **une** information sur un PNJ (aspects, défense et réaction, aspects exceptionnels, points faibles, armes, bouclier, PA et PS, capacités). Coût : **6 PE** et 1 action de déplacement.
- Évolutions :
  - **150 PG** : **+10 PE** au total.
  - **200 PG** : toutes les impulsions.
  - **250 PG** : Falcon sans action pour 3 PE, et **+10 PE**.

### Rogue (LdB p. 153)

- **Mode Ghost** : invisible et silencieux (sauf face à Machine exceptionnelle majeure). **+3 réussites automatiques** pour passer inaperçu.
- La 1ʳᵉ attaque du tour (contact, ou tir *silencieux*) gagne **+Discrétion (OD compris) en dés ET en dégâts fixes**, puis le mode s'arrête.
- Coût : **2 PE par tour** en conflit, ou **6 PE par minute** hors conflit. Aucune action.
- Évolutions :
  - **150 PG** : 2 PE pour 6 tours, ou 6 PE pour 15 minutes.
  - **200 PG** : seule la Machine exceptionnelle majeure détecte la Rogue (avec +3 réussites automatiques pour la Rogue).
  - **250 PG** : 3 PE par attaque pour rester invisible.

### Ranger (LdB p. 157)

- **Fusil Longbow** : base **3D6 dégâts, 1D6 violence**, portée moyenne, effets *lourd*, *deux mains*, *assistance à l'attaque*. Maximum 2 améliorations.
  - **1 PE par effet** : +1D6 aux dégâts ou à la violence (maximum +6D6), ou +1 cran de portée.
  - **2 PE par effet** (3 maximum) : *dégâts continus 3*, *silencieux*, *choc 1*, *perce armure 40*, *ultraviolence*, *désignation*.
  - **3 PE par effet** (3 maximum) : *lumière 4*, *dispersion 3*, *artillerie*, *pénétrant 6*, *perce armure 60*, *anti-véhicule*.
- **La Vision** : voir l'invisible (gaz, pensées, Ghost…). Test base Perception (difficulté 2 à 9). Coût : **5 à 10 PE**.
- Évolutions **achetées** en PG (pas automatiques) :
  - **50 PG** : effets à 6 PE (*anti-Anathème*, *démoralisant*, *pénétrant 10*, *ignore armure*, *en chaîne*, *fureur*).
  - **50 PG** : profil de base 5D6 / 3D6 et plafond de +9D6.
  - **50 PG** : plus d'effet *lourd*.
  - **100 PG** : effets à −2 PE.

### Bard (LdB p. 161)

- **Mode Changeling** : illusion de nanomachines. Coût : **6 PE** (soi), **8 PE** (taille étendue), **3 PE par faux être** (4 maximum). Dure une scène ou 1 h.
- Pour percer l'illusion : un PNJ fait un test de Machine difficulté 6, un PJ un test base Perception difficulté 3. C'est une action de déplacement.
- Évolutions :
  - **150 PG** : portée moyenne et alliés.
  - **200 PG** : −2 PE, détection plus difficile (9 pour un PNJ, 6 pour un PJ).
  - **250 PG** : explosion de nanomachines (3D6+6, *ignore armure*, *ignore CdF*, *dispersion 6*, *choc 1*).

### Wizard (LdB p. 165)

- **Mode Borealis** :
  - Donne *anti-Anathème* aux armes : 6 PE, +2 par allié.
  - Attaque de plasma : **4D6 / 4D6**, portée courte, *anti-Anathème*, *dégâts continus 3*. **2 PE par utilisation** selon le livre, **1 PE** selon la FAQ 2020 (p. 13).
  - Utilitaire : 6 PE.
- **Mode Oriflamme** : zone de portée courte, **6D6+6 dégâts / 6D6+12 violence** sur les créatures de l'Anathème uniquement (moitié à portée moyenne), sans jet pour toucher. Coût : **12 PE** et 1 action de déplacement.
- Évolutions :
  - **150 PG** : Borealis à portée moyenne.
  - **200 PG** : −3 PE sur les deux modes.
  - **250 PG** : Oriflamme à portée moyenne.

### Barbarian (LdB p. 169)

- **Mode Goliath** : **2 PE par mètre** gagné (jusqu'à 6 m au total, soit +4 m). Dure 6 tours.
- Par mètre gagné :
  - **+1 réussite** aux jets de Force ou d'Endurance (+2 si les deux sont utilisés).
  - **+1D6 dégâts et violence au contact.**
  - **+1 CdF.**
  - Mais **−1 défense et −2 réaction**.
- À partir de 6 m : attaques *anti-véhicule* contre les structures, et les armes partent au rack.
- Évolutions :
  - **150 PG** : jusqu'à 8 m.
  - **200 PG** : la défense ne baisse plus.
  - **250 PG** : jusqu'à 10 m.
