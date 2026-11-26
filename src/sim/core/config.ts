/* Constantes de la physique et du combat, à 60 images par seconde.
   Unités : le pixel du monde ; un combattant de taille 1 mesure 100 de haut.
   Les formules d'éjection reprennent celles de Melee (voir combat/knockback.ts), mises à notre échelle. */

export const FPS = 60;

/** Pixels du monde par « unité Melee » (un personnage moyen y mesure ~14 unités). */
export const SCALE = 7;

export const PHYSICS = {
  /** Vitesse d'éjection (px/image) par point d'éjection. */
  launch: 0.03 * SCALE,
  /** Freinage de l'éjection, par image. */
  launchDecay: 0.051 * SCALE,
  /** Images d'étourdissement par point d'éjection. */
  hitstun: 0.4,
  /** Au-delà, le combattant part en vrille (tumble) et peut se faire mettre au sol. */
  tumbleThreshold: 80,
  /** Angle « Sakurai » : petite éjection au ras du sol, grosse en diagonale. */
  sakuraiAngle: 361,
  /** Influence directionnelle : déviation maximale de l'angle d'éjection (degrés). */
  diMax: 18,
  /** Frottement au sol (px/image²). */
  friction: 0.55,
  /** Tampon de saisie : un bouton pressé un peu trop tôt compte encore (images). */
  buffer: 6,
  /** Images pour réussir une récupération au sol (bouclier juste avant l'impact). */
  techWindow: 20,
  /** Images pour une annulation d'atterrissage (L-cancel). */
  lCancelWindow: 7,
} as const;

export const SHIELD = {
  max: 50,
  decay: 0.14,
  regen: 0.08,
  radius: 58,
  /** Images de garde-à-vous après avoir lâché le bouclier. */
  release: 7,
} as const;

export const LEDGE = {
  /** Invincibilité à la saisie d'un rebord (une fois par retour au sol). */
  invincible: 30,
  /** Temps maximum accroché, puis on lâche. */
  max: 300,
  /** Après avoir lâché, on ne peut pas se raccrocher tout de suite. */
  regrabDelay: 24,
} as const;

export const RESPAWN = {
  /** Images entre l'éjection et le retour sur la plateforme. */
  delay: 80,
  /** Temps maximum sur la plateforme de retour. */
  platform: 300,
  /** Invincibilité après l'avoir quittée. */
  invincible: 120,
} as const;
