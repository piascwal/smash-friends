# Consignes pour les agents

- Lire `README.md` avant toute modification (organisation, plan par étapes).
- Identifiants du code en anglais ; textes affichés et commentaires en français. Pas d'emoji.
- Toute modification se termine par `npm run check` (types, lint, tests) et `npm run format`.
- `src/sim/` ne dépend pas du navigateur : la simulation tourne dans les tests et chez l'hôte réseau.
  Le rendu lit le match, il ne le modifie jamais.
- Fichiers courts (ESLint : 300 lignes de code par fichier, 80 par fonction) ; un module par sujet.
- Les images viennent de la banque de sprites : ne pas en ajouter ici. Un besoin nouveau va dans
  `needs.json`, puis dans la banque (`npm run needs -- ../sprite-bank`). Les réglages de gameplay
  (stats, coups) restent dans ce dépôt (`src/sim/roster/`, `src/sim/moves/`).
- Un changement de physique ou de coups : relancer les tests (combats entre IA sur chaque stage).
