/* Fabriques de coups spéciaux. Chaque personnage les assemble selon son style (roster/characters.ts) :
   tir, ruée, remontée, frappe au sol, contre, renvoi, toupie, explosion, esquive, rafale, lévitation. */
import type { ProjectileId } from '../projectiles/types';
import type { PoseKey } from './poses';
import { hb, type Effect, type MoveDef } from './types';

/** Spécial neutre : lance un projectile. */
export const shoot = (pose: PoseKey, id: ProjectileId, frame = 13, total = 40): MoveDef => ({
  id: 'nspecial',
  kind: 'special',
  pose,
  windup: 'block',
  windupEnd: frame - 4,
  total,
  hitboxes: [],
  projectile: { frame, id },
  airControl: 0.6,
  fx: { stretch: 1.06 },
  sfx: 'special',
});

/** Spécial neutre : coup de poing qui se charge tant qu'on tient le bouton. */
export const chargePunch = (windup: PoseKey, pose: PoseKey): MoveDef => ({
  id: 'nspecial',
  kind: 'special',
  pose,
  windup,
  windupEnd: 12,
  total: 46,
  charge: { frame: 8, max: 100, button: 'special', bonus: 1.6 },
  hitboxes: [hb(13, 17, 54, -56, 28, 11, 40, 40, 85)],
  motion: [
    { frame: 12, vx: 12 },
    { frame: 18, vx: 2 },
  ],
  airControl: 0.5,
  fx: { stretch: 1.2, trail: 'smash' },
  sfx: 'smash',
});

interface DashOptions {
  speed?: number;
  dmg?: number;
  angle?: number;
  armor?: boolean;
  effect?: Effect;
  low?: boolean;
}

/** Spécial côté : ruée vers l'avant (une fois par passage en l'air, ne laisse pas impuissant). */
export const dash = (pose: PoseKey, o: DashOptions = {}): MoveDef => ({
  id: 'sspecial',
  kind: 'special',
  pose,
  windup: 'block',
  windupEnd: 8,
  total: 42,
  hitboxes: [hb(9, 20, 40, o.low ? -16 : -52, 26, o.dmg ?? 11, o.angle ?? 40, 45, 70, { effect: o.effect })],
  motion: [
    { frame: 1, vx: 1, vy: 0, gravity: 0.15 },
    { frame: 9, vx: o.speed ?? 14, vy: -1.5 },
    { frame: 22, vx: 3, gravity: 1 },
  ],
  armor: o.armor ? [6, 20] : undefined,
  airControl: 0,
  fx: { stretch: 1.15, trail: 'vitesse' },
  sfx: 'special',
});

interface RisingOptions {
  lift?: number;
  dmg?: number;
  effect?: Effect;
  spin?: boolean;
}

/** Spécial haut : la remontée. Hauteur, puis chute impuissante (on peut saisir le rebord). */
export const rising = (pose: PoseKey, o: RisingOptions = {}): MoveDef => ({
  id: 'uspecial',
  kind: 'special',
  pose,
  windup: 'crouch',
  windupEnd: 4,
  total: 46,
  hitboxes: [
    hb(4, 6, 26, -60, 26, o.dmg ?? 12, 80, 50, 80, { effect: o.effect }),
    hb(7, 22, 10, -80, 24, 4, 88, 30, 60, { effect: o.effect, rehit: 5 }),
  ],
  motion: [
    { frame: 1, vx: 0, vy: 0, gravity: 0 },
    { frame: 4, vx: 3, vy: -(o.lift ?? 19), gravity: 0.55 },
    { frame: 26, gravity: 1 },
  ],
  helpless: true,
  ledgeGrab: true,
  airControl: 0.7,
  fx: { spins: o.spin ? 2 : 0, stretch: 1.12, trail: o.effect === 'fire' ? 'feu' : 'air' },
  sfx: 'special',
});

/** Spécial haut : lévitation lente et longue, bien dirigeable. */
export const levitate = (pose: PoseKey): MoveDef => ({
  id: 'uspecial',
  kind: 'special',
  pose,
  total: 70,
  hitboxes: [hb(4, 8, 0, -50, 34, 7, 80, 50, 60)],
  motion: [
    { frame: 1, vx: 0, vy: -3, gravity: 0 },
    { frame: 6, vy: -9 },
    { frame: 40, vy: -5 },
    { frame: 60, gravity: 0.6 },
  ],
  helpless: true,
  ledgeGrab: true,
  airControl: 1.6,
  fx: { stretch: 1.05, trail: 'air' },
  sfx: 'special',
});

/** Spécial bas au sol : frappe le sol, onde des deux côtés (et parfois des projectiles). */
export const slam = (pose: PoseKey, projectile?: ProjectileId): MoveDef => ({
  id: 'dspecial',
  kind: 'special',
  pose,
  windup: 'jump',
  windupEnd: 10,
  total: 44,
  hitboxes: [hb(12, 15, 50, -12, 30, 12, 75, 45, 75), hb(12, 15, -50, -12, 30, 12, 75, 45, 75)],
  projectile: projectile ? { frame: 12, id: projectile } : undefined,
  fx: { stretch: 1.1, trail: 'smash' },
  sfx: 'smash',
});

/** Spécial bas en l'air : plongeon météore jusqu'au sol. */
export const slamAir = (pose: PoseKey): MoveDef => ({
  id: 'dspecial_air',
  kind: 'special',
  pose,
  total: 60,
  hitboxes: [hb(8, 59, 10, -10, 28, 11, 275, 25, 70)],
  motion: [
    { frame: 1, vx: 0, vy: -4, gravity: 0 },
    { frame: 8, vy: 17 },
  ],
  endOnLanding: true,
  airControl: 0.3,
  fx: { rot: 30, trail: 'air' },
  sfx: 'special',
});

/** Spécial bas : posture de contre. Frappé pendant la fenêtre, on riposte plus fort. */
export const counter = (pose: PoseKey, strike: PoseKey): MoveDef[] => [
  {
    id: 'dspecial',
    kind: 'special',
    pose,
    total: 44,
    hitboxes: [],
    counter: [5, 28],
    airControl: 0.3,
    sfx: 'special',
  },
  {
    id: 'counterhit',
    kind: 'special',
    pose: strike,
    total: 34,
    hitboxes: [hb(4, 8, 50, -56, 34, 10, 361, 50, 80)],
    intangible: [0, 14],
    fx: { stretch: 1.2, trail: 'smash' },
    sfx: 'smash',
  },
];

/** Spécial bas : coup de raquette qui renvoie les projectiles. */
export const reflector = (pose: PoseKey): MoveDef => ({
  id: 'dspecial',
  kind: 'special',
  pose,
  total: 36,
  hitboxes: [hb(5, 9, 40, -60, 30, 8, 50, 30, 60)],
  reflect: [3, 18],
  airControl: 0.6,
  fx: { stretch: 1.1 },
  sfx: 'special',
});

/** Toupie : touche plusieurs fois autour de soi puis éjecte. */
export const spin = (id: 'dspecial' | 'sspecial', pose: PoseKey, move = 0): MoveDef => ({
  id,
  kind: 'special',
  pose,
  total: 50,
  hitboxes: [
    hb(6, 26, 0, -50, 46, 2, 365, 0, 0, { rehit: 5, wkb: 30 }),
    hb(28, 31, 0, -50, 52, 6, 50, 55, 90),
  ],
  motion: move ? [{ frame: 1, vx: move, vy: -2, gravity: 0.25 }] : [{ frame: 1, gravity: 0.3, vy: -2 }],
  airControl: 1,
  fx: { spins: 4, trail: 'air' },
  sfx: 'special',
});

/** Explosion d'énergie tout autour après une courte charge. */
export const burst = (pose: PoseKey): MoveDef => ({
  id: 'dspecial',
  kind: 'special',
  pose,
  windup: 'crouch',
  windupEnd: 16,
  total: 56,
  hitboxes: [hb(18, 22, 0, -50, 70, 16, 70, 50, 85, { effect: 'electric' })],
  motion: [{ frame: 1, vx: 0, vy: 0, gravity: 0.1 }],
  fx: { stretch: 1.2, trail: 'smash' },
  sfx: 'smash',
});

/** Esquive titubante (intangible) suivie d'un coup. */
export const sway = (pose: PoseKey): MoveDef => ({
  id: 'dspecial',
  kind: 'special',
  pose,
  total: 40,
  hitboxes: [hb(22, 25, 46, -60, 28, 10, 361, 40, 85)],
  intangible: [3, 20],
  motion: [
    { frame: 3, vx: -4 },
    { frame: 18, vx: 6 },
    { frame: 26, vx: 0 },
  ],
  sfx: 'special',
});

/** Rafale de coups devant soi. */
export const flurry = (pose: PoseKey): MoveDef => ({
  id: 'dspecial',
  kind: 'special',
  pose,
  total: 48,
  hitboxes: [
    hb(6, 30, 44, -60, 28, 2, 365, 0, 0, { rehit: 4, wkb: 25 }),
    hb(32, 34, 50, -60, 32, 6, 361, 50, 95),
  ],
  airControl: 0.4,
  fx: { stretch: 1.08 },
  sfx: 'special',
});
