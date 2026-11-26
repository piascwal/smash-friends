/* Attaques de relevé : au sol après une chute, et depuis un rebord. */
import { hb, type MoveDef } from './types';

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
