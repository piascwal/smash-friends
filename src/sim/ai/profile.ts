/* Le profil d'une IA selon son niveau (1 à 9) : chaque capacité progresse avec le niveau.
   Un niveau 1 réagit lentement, hésite, attaque peu et mal ; un niveau 9 réagit vite, défend,
   punit les erreurs, enchaîne et garde le bord. */

export interface Profile {
  /** Images avant de réagir à ce qui se passe. */
  reaction: number;
  /** Envie d'attaquer quand c'est possible (0 à 1). */
  aggression: number;
  /** Chance de se protéger d'un coup qui arrive. */
  defense: number;
  /** Images pour lever le bouclier face à un coup vu venir (l'anticipation va plus vite que la décision). */
  guardReaction: number;
  /** Chance de choisir le bon coup (sinon un coup au hasard, parfois dans le vide). */
  accuracy: number;
  /** Chance de punir une erreur (atterrissage, coup raté, chute). */
  punish: number;
  /** Sait reconnaître les pourcents où un smash éjecte. */
  killSense: number;
  /** Fiabilité du retour sur le stage. */
  recovery: number;
  di: number;
  tech: number;
  /** Enchaîne avec des aériens sur un adversaire en l'air. */
  combo: boolean;
  /** Attend l'adversaire au bord quand il est hors du stage. */
  edgeguard: boolean;
  /** Utilise son projectile à distance. */
  zoning: number;
}

const lerp = (a: number, b: number, s: number) => a + (b - a) * s;

export function profileFor(level: number): Profile {
  const s = Math.max(0, Math.min(1, (level - 1) / 8));
  return {
    reaction: Math.round(lerp(34, 6, s)),
    aggression: lerp(0.25, 0.85, s),
    defense: lerp(0.03, 0.8, s),
    guardReaction: Math.round(lerp(16, 2, s)),
    accuracy: lerp(0.45, 0.97, s),
    punish: lerp(0.1, 0.9, s),
    killSense: lerp(0.2, 1, s),
    recovery: lerp(0.55, 1, s),
    di: lerp(0, 0.9, s),
    tech: lerp(0, 0.7, s),
    combo: level >= 4,
    edgeguard: level >= 5,
    zoning: lerp(0.1, 0.45, s),
  };
}
