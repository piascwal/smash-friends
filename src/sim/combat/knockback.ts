/* Éjection : plus la cible a de pourcents, plus elle vole loin ; les poids lourds résistent mieux.
   La force dépend des pourcents, des dégâts du coup, du poids, d'une éjection de base et d'une croissance. */
import { PHYSICS } from '../core/config';
import { rad } from '../core/math';

export interface KnockbackInput {
  /** Pourcents de la cible APRÈS le coup. */
  percent: number;
  damage: number;
  weight: number;
  bkb: number;
  kbg: number;
  /** Éjection fixe : remplace pourcents et dégâts. */
  wkb?: number;
}

export function knockback(k: KnockbackInput): number {
  const p = k.wkb !== undefined ? 10 : k.percent;
  const d = k.wkb !== undefined ? k.wkb : k.damage;
  const growth = ((p / 10 + (p * d) / 20) * (200 / (k.weight + 100)) * 1.4 + 18) * (k.kbg / 100);
  return growth + k.bkb;
}

/** L'angle réel (degrés) : l'angle automatique dépend de la force et de si la cible est au sol. */
export function resolveAngle(angle: number, kb: number, grounded: boolean): number {
  if (angle !== PHYSICS.autoAngle) return angle;
  if (!grounded) return 45;
  return kb < 32 ? 0 : 44;
}

export const hitstunFrames = (kb: number): number => Math.floor(kb * PHYSICS.hitstun);

/** Temps d'arrêt sur image à l'impact (des deux côtés), selon les dégâts. */
export const hitlagFrames = (damage: number, mult = 1): number =>
  Math.min(20, Math.floor((damage / 3 + 3) * mult));

/**
 * Influence directionnelle (DI) : la cible tient son stick perpendiculairement à l'éjection pour
 * dévier sa trajectoire de 18° au plus. Angles en degrés, repère mathématique (y vers le haut).
 */
export function applyDI(angleDeg: number, stickX: number, stickYUp: number): number {
  const mag = Math.hypot(stickX, stickYUp);
  if (mag < 0.25) return angleDeg;
  const a = rad(angleDeg);
  const lx = Math.cos(a);
  const ly = Math.sin(a);
  // composante perpendiculaire du stick (produit vectoriel), entre -1 et 1
  const perp = (lx * stickYUp - ly * stickX) / Math.max(1, mag);
  return angleDeg + PHYSICS.diMax * perp;
}

/** Vitesse de lancement (px/image, y vers le bas) pour une éjection donnée. */
export function launchVelocity(kb: number, angleDeg: number, dir: number): { vx: number; vy: number } {
  const speed = kb * PHYSICS.launch;
  const a = rad(angleDeg);
  return { vx: Math.cos(a) * speed * dir, vy: -Math.sin(a) * speed };
}
