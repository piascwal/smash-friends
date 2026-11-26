/* Chopes, coups pendant la chope, lancers, et attaques de relevé (au sol, au rebord). */
import { hb, type MoveDef } from './types';

export const grab: MoveDef = {
  id: 'grab',
  kind: 'grab',
  pose: 'punch_light',
  total: 30,
  hitboxes: [hb(7, 8, 40, -56, 22, 0, 0, 0, 0, { grab: true })],
  sfx: 'whoosh',
};

export const dashGrab: MoveDef = {
  id: 'dashgrab',
  kind: 'grab',
  pose: 'punch_heavy',
  total: 38,
  hitboxes: [hb(10, 11, 50, -56, 24, 0, 0, 0, 0, { grab: true })],
  motion: [{ frame: 1, vx: 4 }],
  sfx: 'whoosh',
};

export const pummel: MoveDef = {
  id: 'pummel',
  kind: 'throw',
  pose: 'punch_light',
  total: 18,
  hitboxes: [],
  sfx: 'light',
};

/** Lancers : la frappe est appliquée à l'image de lâcher par le module de chope. */
export const fthrow: MoveDef = {
  id: 'fthrow',
  kind: 'throw',
  pose: 'punch_heavy',
  total: 30,
  hitboxes: [hb(10, 10, 40, -50, 30, 8, 45, 60, 55)],
  sfx: 'heavy',
};

export const bthrow: MoveDef = {
  id: 'bthrow',
  kind: 'throw',
  pose: 'kick_heavy',
  total: 34,
  hitboxes: [hb(14, 14, -40, -50, 30, 10, 135, 60, 70, { behind: true })],
  fx: { flipAt: 8 },
  sfx: 'heavy',
};

export const uthrow: MoveDef = {
  id: 'uthrow',
  kind: 'throw',
  pose: 'uppercut',
  total: 32,
  hitboxes: [hb(12, 12, 10, -90, 30, 7, 90, 70, 55)],
  sfx: 'heavy',
};

export const dthrow: MoveDef = {
  id: 'dthrow',
  kind: 'throw',
  pose: 'crouch_punch',
  total: 30,
  hitboxes: [hb(12, 12, 30, -20, 30, 6, 82, 60, 35)],
  sfx: 'medium',
};

export const getupAttack: MoveDef = {
  id: 'getup',
  kind: 'ground',
  pose: 'kick_light',
  total: 32,
  hitboxes: [hb(10, 14, 44, -30, 26, 6, 361, 40, 50), hb(10, 14, -44, -30, 26, 6, 361, 40, 50)],
  intangible: [0, 12],
  sfx: 'medium',
};

export const ledgeAttack: MoveDef = {
  id: 'ledge',
  kind: 'ground',
  pose: 'kick_heavy',
  total: 40,
  hitboxes: [hb(18, 22, 46, -40, 26, 8, 361, 40, 50)],
  intangible: [0, 18],
  motion: [{ frame: 1, vx: 2 }],
  sfx: 'medium',
};
