/* Coups au sol communs à tous : enchaînement de base, inclinaisons, attaque en course et smashs.
   Valeurs inspirées de Melee (un personnage moyen), ajustées ensuite par les stats de chacun. */
import { hb, type MoveDef } from './types';

export const jab1: MoveDef = {
  id: 'jab1',
  kind: 'ground',
  pose: 'punch_light',
  total: 16,
  hitboxes: [hb(3, 4, 34, -62, 17, 3, 80, 8, 30)],
  next: { id: 'jab2', from: 5, to: 15 },
  sfx: 'light',
};

export const jab2: MoveDef = {
  id: 'jab2',
  kind: 'ground',
  pose: 'punch_heavy',
  total: 17,
  hitboxes: [hb(3, 4, 40, -60, 18, 3, 80, 8, 30)],
  next: { id: 'jab3', from: 5, to: 16 },
  fx: { stretch: 1.05 },
  sfx: 'light',
};

export const jab3: MoveDef = {
  id: 'jab3',
  kind: 'ground',
  pose: 'kick_light',
  total: 28,
  hitboxes: [hb(5, 7, 44, -50, 22, 5, 361, 35, 90)],
  sfx: 'medium',
};

export const ftilt: MoveDef = {
  id: 'ftilt',
  kind: 'ground',
  pose: 'kick_light',
  windup: 'block',
  windupEnd: 4,
  total: 28,
  hitboxes: [hb(6, 9, 50, -52, 22, 9, 361, 12, 100)],
  sfx: 'medium',
};

export const utilt: MoveDef = {
  id: 'utilt',
  kind: 'ground',
  pose: 'uppercut',
  windup: 'crouch',
  windupEnd: 4,
  total: 30,
  hitboxes: [hb(5, 7, 22, -70, 20, 7, 95, 30, 105), hb(8, 11, 4, -118, 24, 7, 92, 30, 105)],
  sfx: 'medium',
};

export const dtilt: MoveDef = {
  id: 'dtilt',
  kind: 'ground',
  pose: 'crouch_kick',
  windup: 'crouch',
  windupEnd: 3,
  total: 22,
  hitboxes: [hb(5, 7, 56, -14, 18, 8, 78, 22, 90)],
  sfx: 'medium',
};

export const dashAttack: MoveDef = {
  id: 'dash',
  kind: 'ground',
  pose: 'kick_heavy',
  total: 38,
  hitboxes: [hb(6, 10, 46, -48, 24, 11, 60, 50, 70), hb(11, 18, 42, -48, 20, 7, 60, 40, 60)],
  motion: [
    { frame: 1, vx: 10 },
    { frame: 18, vx: 3 },
  ],
  fx: { stretch: 1.08, trail: 'vitesse' },
  sfx: 'medium',
};

/** Smash avant : se charge en tenant le bouton, part en coup de poing lourd. */
export const fsmash: MoveDef = {
  id: 'fsmash',
  kind: 'ground',
  pose: 'punch_heavy',
  windup: 'block',
  windupEnd: 10,
  total: 50,
  charge: { frame: 6, max: 60, button: 'smash', bonus: 0.4 },
  hitboxes: [hb(12, 15, 58, -60, 26, 16, 361, 30, 100), hb(12, 15, 26, -60, 20, 13, 361, 25, 95)],
  motion: [
    { frame: 11, vx: 5 },
    { frame: 16, vx: 0 },
  ],
  fx: { stretch: 1.15, trail: 'smash' },
  sfx: 'smash',
};

export const usmash: MoveDef = {
  id: 'usmash',
  kind: 'ground',
  pose: 'uppercut',
  windup: 'crouch',
  windupEnd: 8,
  total: 46,
  charge: { frame: 5, max: 60, button: 'smash', bonus: 0.4 },
  hitboxes: [hb(9, 10, 26, -60, 22, 15, 88, 34, 100), hb(11, 15, 6, -124, 30, 15, 88, 34, 100)],
  fx: { stretch: 1.18, trail: 'smash' },
  sfx: 'smash',
};

/** Smash bas : frappe devant puis derrière (l'image se retourne à mi-coup). */
export const dsmash: MoveDef = {
  id: 'dsmash',
  kind: 'ground',
  pose: 'crouch_kick',
  windup: 'crouch',
  windupEnd: 6,
  total: 48,
  charge: { frame: 4, max: 60, button: 'smash', bonus: 0.4 },
  hitboxes: [
    hb(7, 9, 58, -14, 22, 14, 25, 28, 95),
    hb(15, 17, -58, -14, 22, 14, 25, 28, 95, { behind: true }),
  ],
  fx: { flipAt: 13, trail: 'smash' },
  sfx: 'smash',
};
