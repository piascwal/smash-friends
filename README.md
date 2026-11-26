# Smash Friends

Combat de plateformes entre potes, dans l'esprit de Super Smash Bros. Melee : on ne vide pas une barre de
vie, on fait monter les **pourcents** de l'adversaire jusqu'à pouvoir l'**éjecter** hors de l'écran d'un
**smash** bien placé. Jusqu'à 4 joueurs (humains ou IA de niveau 1 à 9), chacun pour soi ou en équipes
(2 contre 1, 2 contre 2…), aux vies ou au temps, avec ou sans objets.

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

Les coups au sol : **A seul** donne le jab ; **direction + A maintenu** charge le smash de cette
direction (avant, haut, bas), qui part quand on lâche A ; **direction + A bref** donne le coup rapide
(tilt). À la manette, le stick droit lance un smash directement. En l'air, direction + A donne l'aérien.
On ramasse un objet avec A et on le lance avec B.

Sur téléphone : stick virtuel à gauche, trois boutons à droite (A, B, GARDE). Deux joueurs peuvent partager un clavier (une
moitié chacun) ; une manette rejoint la partie en appuyant sur A à la sélection.

Ce qui fait le gameplay « Melee » :

- **Éjection** calculée avec la formule de Melee (pourcents, dégâts, poids, éjection de base et
  croissance), étourdissement proportionnel, vrille au-delà d'un seuil, angle « Sakurai ».
- **Smashs chargés** (jusqu'à +40 %) : direction + A maintenu, lâcher pour frapper.
- **Influence directionnelle** (DI) : tenir le stick pendant l'arrêt sur image dévie l'éjection de 18°.
- **Bouclier** qui s'use et casse (étourdi), roulades, esquive sur place, esquive aérienne
  directionnelle (le wavedash marche), **récupération au sol** (bouclier juste avant l'impact),
  **L-cancel** (lag d'atterrissage divisé par deux), chute rapide, saut court, dash dance.
- **Rebords** : saisie automatique avec invincibilité, un seul par rebord (ledge hog), remontée,
  saut, roulade, attaque.
- **Météores** (aérien bas), spéciaux par personnage selon son style (projectiles, ruées, remontées,
  contre, renvoi de projectiles, toupies…).
- **Objets** (images de la banque, lancés avec B) : dauphin (la « batte »), frisbee qui revient, boîtier de CD, baladeur
  qui tire, pile et baril qui explosent, caisses et tonneaux qui libèrent d'autres objets, donuts et
  cœur qui soignent, étoile d'invincibilité.
- **Motion design** : arrêt sur image et tremblement à l'impact, étincelles selon l'effet (feu,
  électricité, glace), fumée et traînées d'éjection, faisceau coloré au bord de l'écran à chaque KO,
  éjection en étoile, ralenti zoomé et éclair rouge du **coup fatal**, HUD dont les pourcents tremblent et
  rougissent.

## Plan par étapes

1. **Combat local complet** (fait) : simulation, 14 personnages, 7 stages, objets, IA 1-9, équipes,
   vies/temps, mort subite, sélection façon Smash, résultats, sons synthétisés, PWA, déploiement Pages.
2. **Réseau local** (fait, à éprouver sur un vrai Wi-Fi) : avec [lan-kit](https://github.com/piascwal/lan-kit),
   un appareil crée la partie et fait tourner le combat ; les autres la trouvent sans saisir d'adresse,
   envoient leurs commandes (5 octets par image) et reçoivent un instantané à chaque image. Places libres
   en CPU ; un invité qui se déconnecte est remplacé par l'IA. Pistes : prédiction locale du joueur pour
   masquer la latence, spectateurs, jeu par Internet avec un code de salon (déjà dans lan-kit).
3. **Équilibrage et identité** : régler chaque personnage (poids, vitesses, portées, pourcents de KO) en
   jouant ; coups normaux propres à chaque style ; boîtes de coups ajustées aux images.
4. **Nouvelles poses dans la banque** (atelier de sprite-bank) pour remplacer les poses de repli :
   `smash_charge` (préparation du smash), `ledge_hang` (accroché au rebord), `grab_hold` (tenir),
   `roll`, `airdodge`, `tumble` (vrille), `shield`, `taunt` (provocation), `dizzy`. Le jeu les utilisera
   dès qu'elles seront dans `needs.json`.
5. **Contenu** : musiques par stage, plus de stages (dangers de stage, stages mobiles), plus d'objets
   (marteau, ballon de foot, Pokéball-like avec les animaux de la banque), mode Entraînement (affichage des
   boîtes de coups, vitesse réduite), mode Classique (enchaînement de combats contre l'IA), Home-Run
   Contest, statistiques et replays (la simulation est déterministe : rejouer les commandes suffit).

## Organisation

```
src/sim/          la simulation, sans navigateur (tests, hôte réseau)
  core/           maths, hasard reproductible, commandes, constantes physiques
  stage/          définition des stages, plateformes mobiles, rebords
  fighter/        un combattant : états (sol, air, défense, dégâts, rebord, chope), physique, coups
  moves/          coups communs, spéciaux (fabriques), objets ; assemblage par personnage
  combat/         éjection (Melee), application des frappes, détection, prédiction du KO
  projectiles/    catalogue et vol des projectiles
  items/          catalogue, ramassage, lancers, explosions, apparition
  roster/         stats et spéciaux de chaque personnage
  match/          réglages, boucle d'une image, éjections, règles, événements
  ai/             IA : recentrage, retour sur le stage, choix des coups, objets
src/render/       rendu canvas : caméra, sprites, décor, plateformes, effets, HUD
src/audio/        sons synthétisés (WebAudio), voix de l'annonceur
src/input/        clavier, manettes, tactile, navigation des menus
src/ui/           écrans en DOM (titre, menu, sélection, stages, résultats, options)
src/app/          application : enchaînement des écrans, écran de combat, préférences, PWA
src/net/          réseau local : protocole, hôte, invité, instantanés, écrans du salon
tests/            éjection, combats entre IA sur chaque stage, classement, instantanés réseau
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
