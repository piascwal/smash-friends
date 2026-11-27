# Smash Friends

Combat de plateformes entre potes. On ne vide pas une barre de vie : on fait monter les **pourcents** de
l'adversaire jusqu'à pouvoir l'**éjecter** hors de l'écran d'un **smash** bien placé. Jusqu'à 4 joueurs
(humains ou IA de niveau 1 à 9), chacun pour soi ou en équipes (2 contre 1, 2 contre 2…), aux vies ou au
temps, avec ou sans objets ; un mode entraînement pour tester chaque personnage.

Les 14 personnages viennent de la [banque de sprites](https://github.com/piascwal/sprite-bank) (le look
« combat » en pied, celui de Fighting Friends). L'application est publiée sur GitHub Pages, en plein écran,
et s'installe comme une application sur Android (PWA, menu du navigateur : « Installer »).

## Jouer

| Action             | Clavier gauche | Clavier droite | Manette           | Tactile            |
| ------------------ | -------------- | -------------- | ----------------- | ------------------ |
| Bouger             | Z Q S D        | Flèches        | Stick gauche      | Stick virtuel      |
| Saut               | Espace         | I              | Stick haut, X, Y  | Stick vers le haut |
| Attaque / smash    | F              | J              | A                 | A                  |
| Spécial / lancer   | G              | K              | B                 | B                  |
| Bouclier / esquive | Maj gauche     | L              | Gâchettes, LB, RB | GARDE              |

Les coups au sol :

- **A** : coup de poing (enchaînement en trois coups si on rappuie) ; avec le stick vers l'avant, on
  continue d'avancer en frappant.
- **Direction + A** prépare toujours le smash de cette direction (priorité au smash) : maintenu, il se
  charge et part quand on lâche A. **Appui bref** : c'est le coup rapide à la place (coup de poing vers
  l'avant, et pendant un coup de poing chaque appui enchaîne le suivant, sans repasser par le smash).
- En l'air, direction + A donne l'aérien. À la manette, le stick droit lance un smash directement.
- On ramasse un objet avec A et on le lance avec B.

Sur téléphone : stick virtuel à gauche, trois boutons à droite (A, B, GARDE) ; dans les Options, on peut
ajouter un bouton de saut et un bouton smash. Deux joueurs peuvent partager un clavier (une moitié
chacun) ; une manette rejoint la partie en appuyant sur A à la sélection.

Le gameplay :

- **Éjection** : elle grandit avec les pourcents et les dégâts du coup, et diminue avec le poids de la
  cible ; au-delà d'un seuil, la cible part en vrille et peut être mise au sol.
- **Smashs chargés** (jusqu'à +40 %).
- **Influence directionnelle** : tenir le stick au moment de l'impact dévie l'éjection de 18°.
- **Défense** : bouclier qui s'use et casse (étourdi), roulades, esquive sur place, esquive aérienne
  directionnelle, **récupération au sol** (bouclier juste avant l'impact), **atterrissage amorti**
  (bouclier juste avant de toucher le sol après un aérien), chute rapide, saut court.
- **Rebords** : saisie automatique avec invincibilité, un seul combattant par rebord ; remontée, saut,
  roulade ou attaque.
- **Collisions** : les combattants se repoussent ; on passe à travers en roulant ou en esquivant.
- **Météores** (aérien bas), spéciaux par personnage selon son style (projectiles, ruées, remontées,
  contre, renvoi de projectiles, toupies…).
- **Objets** (images de la banque) : dauphin (frappe très fort), frisbee qui revient, boîtier de CD,
  baladeur qui tire, pile et baril qui explosent, caisses et tonneaux qui libèrent d'autres objets, donuts
  et cœur qui soignent, étoile d'invincibilité.
- **14 stages** : sept ouverts (trois plateformes, terrain plat, nuage mobile, grand stage étagé,
  escalier, glace, ascenseurs) et sept à structures (pont sans bord où l'on ne sort que par les côtés,
  temple avec gouffre et pont suspendu, piliers, tour centrale, parois de verre, comptoir, îles
  flottantes).
- **IA** de niveau 1 à 9 : réaction, agressivité, défense, précision, punitions, retour sur le stage.
- **Entraînement** : mannequin immobile, en garde, qui saute, qui marche ou IA ; ralenti, zones de
  frappe visibles, pourcents réglables, objets à volonté, compteur de combos.
- **Effets** : arrêt sur image et tremblement à l'impact, étincelles selon l'effet (feu, électricité,
  glace), fumée et traînées d'éjection, faisceau coloré au bord de l'écran à chaque KO, éjection en
  étoile, ralenti zoomé et éclair rouge du **coup fatal**, HUD dont les pourcents tremblent et rougissent.

## Plan par étapes

1. **Combat local complet** (fait) : simulation, personnages, stages, objets, IA, équipes, vies/temps,
   mort subite, sélection, résultats, sons synthétisés, PWA, déploiement Pages.
2. **Réseau local** (fait, à éprouver sur un vrai Wi-Fi) : avec [lan-kit](https://github.com/piascwal/lan-kit),
   un appareil crée la partie et fait tourner le combat ; les autres la trouvent sans saisir d'adresse,
   envoient leurs commandes (5 octets par image) et reçoivent un instantané à chaque image. Places libres
   en CPU ; un invité qui se déconnecte est remplacé par l'IA. Pistes : prédiction locale du joueur pour
   masquer la latence, spectateurs, jeu par Internet avec un code de salon (déjà dans lan-kit).
3. **Commandes, IA, mondes, entraînement** (fait) : commandes simplifiées, IA sans aller-retour,
   collisions, stages à structures, mode entraînement.
4. **Équilibrage et identité** : régler chaque personnage (poids, vitesses, portées, pourcents de KO) en
   jouant ; coups normaux propres à chaque style ; zones de frappe ajustées aux images.
5. **Nouvelles poses dans la banque** (atelier de sprite-bank) pour remplacer les poses de repli :
   `smash_charge` (préparation du smash), `ledge_hang` (accroché au rebord), `roll`, `airdodge`,
   `tumble` (vrille), `taunt` (provocation). Le jeu les utilisera dès qu'elles seront dans `needs.json`.
6. **Contenu** : musiques par stage, dangers de stage, plus d'objets (marteau, ballon de foot, animaux
   de la banque en renfort), mode Classique (enchaînement de combats contre l'IA), concours du plus long
   lancer, statistiques et replays (la simulation est déterministe : rejouer les commandes suffit).

## Organisation

```
src/sim/          la simulation, sans navigateur (tests, hôte réseau)
  core/           maths, hasard reproductible, commandes, constantes physiques
  stage/          stages (ouverts, à structures), plateformes mobiles, rebords
  fighter/        un combattant : états (sol, air, défense, dégâts, rebord), physique, coups, collisions
  moves/          coups communs, spéciaux (fabriques), objets ; assemblage par personnage
  combat/         éjection, application des frappes, détection, prédiction du KO
  projectiles/    catalogue et vol des projectiles
  items/          catalogue, ramassage, lancers, explosions, apparition
  roster/         stats et spéciaux de chaque personnage
  match/          réglages, boucle d'une image, éjections, règles, événements
  ai/             IA : profil par niveau, intentions, déplacements, défense, coups, retour ; mannequin
src/render/       rendu canvas : caméra, sprites, décor, plateformes, effets, HUD, zones de frappe
src/audio/        sons synthétisés (WebAudio), voix de l'annonceur
src/input/        clavier, manettes, tactile, navigation des menus
src/ui/           écrans en DOM (titre, menu, sélection, stages, résultats, options)
src/app/          application : enchaînement des écrans, combat, entraînement, préférences, PWA
src/net/          réseau local : protocole, hôte, invité, instantanés, écrans du salon
tests/            éjection, combats entre IA sur chaque stage, IA, commandes, entraînement, réseau
```

Principes : la simulation tourne à 60 images par seconde à pas fixe et émet des événements ; le rendu
lit le match sans le modifier. Fichiers courts (ESLint : 300 lignes par fichier, 80 par fonction).

## Développer

```bash
npm install
npm run sprites -- --local ../sprite-bank   # ou sans --local : télécharge la dernière v2 de la banque
npm run dev                                  # http://localhost:5173 (aussi sur le réseau local)
npm run check                                # types + lint + tests
npm run format
```

Les images ne sont pas versionnées ici : `npm run sprites` copie celles que le jeu demande
(`needs.json`) dans `public/assets/`. Un besoin nouveau va dans `needs.json` puis dans la banque
(`npm run needs -- ../sprite-bank`).

À chaque push sur `main`, l'action « Construire et publier » récupère les sprites, vérifie, construit et
publie sur GitHub Pages (Settings > Pages > Source : GitHub Actions).
