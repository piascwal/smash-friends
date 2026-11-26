/* Coups avec un objet en main : coup de dauphin (la « batte »), tir au baladeur, lancer. */
import { hb, type MoveDef } from './types';

export const itemSwing: MoveDef = {
  id: 'itemswing',
  kind: 'item',
  pose: 'punch_heavy',
  windup: 'block',
  windupEnd: 5,
  total: 26,
  hitboxes: [hb(7, 10, 62, -62, 30, 10, 361, 30, 85)],
  fx: { stretch: 1.1 },
  sfx: 'heavy',
};

/** Le coup de circuit : énorme éjection, à placer au bon moment. */
export const itemSmash: MoveDef = {
  id: 'itemsmash',
  kind: 'item',
  pose: 'punch_heavy',
  windup: 'block',
  windupEnd: 14,
  total: 58,
  charge: { frame: 8, max: 60, button: 'smash', bonus: 0.4 },
  hitboxes: [hb(16, 18, 70, -62, 36, 24, 40, 60, 110, { effect: 'slash' })],
  fx: { stretch: 1.2, trail: 'smash' },
  sfx: 'smash',
};

export const itemShoot: MoveDef = {
  id: 'itemshoot',
  kind: 'item',
  pose: 'punch_light',
  total: 14,
  hitboxes: [],
  projectile: { frame: 4, id: 'onde_son' },
  airControl: 1,
  sfx: 'light',
};

/** Lancer : l'objet part à l'image 6 (voir items/carry.ts). */
export const itemThrow: MoveDef = {
  id: 'itemthrow',
  kind: 'item',
  pose: 'punch_heavy',
  windup: 'block',
  windupEnd: 5,
  total: 22,
  hitboxes: [],
  airControl: 1,
  fx: { stretch: 1.12 },
  sfx: 'whoosh',
};

export const ITEM_THROW_FRAME = 6;
