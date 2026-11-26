/* Gabarits de stats : chaque personnage part d'un gabarit et en ajuste quelques valeurs. */
import type { Stats } from './types';

export const MOYEN: Stats = {
  weight: 100,
  size: 1,
  walk: 3.6,
  run: 8,
  jump: 17,
  shortHop: 10.5,
  doubleJump: 16,
  airJumps: 1,
  gravity: 0.72,
  fall: 11,
  fastFall: 16,
  air: 5,
  airAccel: 0.4,
  power: 1,
  speed: 1,
};

export const LOURD: Stats = {
  ...MOYEN,
  weight: 118,
  walk: 3.1,
  run: 7,
  jump: 16,
  doubleJump: 15,
  gravity: 0.78,
  fall: 12,
  fastFall: 17,
  air: 4.4,
  airAccel: 0.34,
  power: 1.15,
  speed: 1.1,
};

export const LEGER: Stats = {
  ...MOYEN,
  weight: 82,
  walk: 4,
  run: 9.4,
  jump: 18,
  shortHop: 11,
  doubleJump: 17,
  gravity: 0.74,
  fall: 11.5,
  fastFall: 17,
  air: 5.6,
  airAccel: 0.48,
  power: 0.9,
  speed: 0.88,
};

export const FLOTTANT: Stats = {
  ...MOYEN,
  weight: 88,
  walk: 3.4,
  run: 7.4,
  jump: 15.5,
  doubleJump: 15,
  airJumps: 2,
  gravity: 0.56,
  fall: 8.5,
  fastFall: 13,
  air: 5.2,
  airAccel: 0.45,
  power: 0.95,
};
