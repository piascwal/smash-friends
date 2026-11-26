/* Attaques aériennes communes. Le lag à l'atterrissage est divisé par deux par une annulation
   (bouclier juste avant de toucher le sol), comme dans Melee. */
import { hb, type MoveDef } from './types';

export const nair: MoveDef = {
  id: 'nair',
  kind: 'air',
  pose: 'jump_kick',
  total: 36,
  hitboxes: [hb(4, 7, 22, -46, 28, 11, 361, 10, 100), hb(8, 22, 22, -46, 24, 6, 361, 5, 100)],
  landingLag: 12,
  fx: { stretch: 1.06 },
  sfx: 'medium',
};

export const fair: MoveDef = {
  id: 'fair',
  kind: 'air',
  pose: 'jump_punch',
  total: 40,
  hitboxes: [hb(11, 14, 46, -50, 26, 14, 361, 20, 100)],
  landingLag: 20,
  fx: { rot: 15, stretch: 1.12, trail: 'air' },
  sfx: 'heavy',
};

export const bair: MoveDef = {
  id: 'bair',
  kind: 'air',
  pose: 'jump_kick',
  total: 34,
  hitboxes: [hb(6, 10, -46, -48, 26, 13, 361, 15, 100, { behind: true })],
  landingLag: 14,
  fx: { mirror: true, stretch: 1.1, trail: 'air' },
  sfx: 'heavy',
};

export const uair: MoveDef = {
  id: 'uair',
  kind: 'air',
  pose: 'uppercut',
  total: 32,
  hitboxes: [hb(5, 10, 6, -112, 28, 10, 85, 22, 100)],
  landingLag: 12,
  fx: { stretch: 1.1 },
  sfx: 'medium',
};

/** Aérien bas : un météore qui renvoie vers le bas ceux qui reviennent sur le stage. */
export const dair: MoveDef = {
  id: 'dair',
  kind: 'air',
  pose: 'jump_kick',
  total: 44,
  hitboxes: [hb(14, 17, 6, -2, 26, 14, 280, 20, 90), hb(18, 26, 6, -2, 20, 9, 300, 15, 70)],
  landingLag: 24,
  fx: { rot: 70, trail: 'air' },
  sfx: 'heavy',
};
