/* Petits outils pour décrire les stages. */
import type { PlatformDef } from './types';

/** Sol plein avec rebords, en île flottante. */
export const ground = (x: number, w: number, h = 130, y = 0): PlatformDef => ({
  x,
  y,
  w,
  h,
  solid: true,
  ledges: true,
});

/** Bloc plein et droit : pilier, mur, tour, comptoir. Ses côtés arrêtent les combattants. */
export const block = (x: number, y: number, w: number, h: number, ledges = false): PlatformDef => ({
  x,
  y,
  w,
  h,
  solid: true,
  ledges,
  shape: 'block',
});

/** Plateforme fine qu'on traverse par en dessous. */
export const thin = (x: number, y: number, w: number, move?: PlatformDef['move']): PlatformDef => ({
  x,
  y,
  w,
  h: 14,
  solid: false,
  move,
});

export const spawns4 = (l: number, y = 0) => [
  { x: -l, y },
  { x: l, y },
  { x: -l / 3, y },
  { x: l / 3, y },
];
