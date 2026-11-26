/* Petits scripts de commandes pour l'IA : une action = quelques images de commandes. */
import { BUTTONS, type Button, type Controls } from '../core/input';

export const ctrl = (x = 0, y = 0, buttons: Button[] = [], cx = 0, cy = 0): Controls => ({
  x,
  y,
  cx,
  cy,
  buttons: buttons.reduce((m, b) => m | BUTTONS[b], 0),
});

/** Appuie une image puis relâche (pour qu'un prochain appui soit bien un nouvel appui). */
export const tap = (x: number, y: number, ...buttons: Button[]): Controls[] => [
  ctrl(x, y, buttons),
  ctrl(x, y),
];

/** Saut court puis aérien dans la direction donnée. */
export function shortHopAerial(towardX: number, dirX: number, dirY: number, delay = 5): Controls[] {
  const out: Controls[] = [ctrl(towardX, 0, ['jump']), ctrl(towardX, 0)];
  for (let i = 0; i < delay; i++) out.push(ctrl(towardX, 0));
  out.push(ctrl(dirX, dirY, ['attack']), ctrl(towardX, 0));
  return out;
}

/** Smash chargé : maintient le bouton smash `charge` images. */
export function chargedSmash(dirX: number, dirY: number, charge: number): Controls[] {
  const out: Controls[] = [];
  for (let i = 0; i < Math.max(1, charge); i++) out.push(ctrl(dirX, dirY, ['smash']));
  out.push(ctrl(0, 0));
  return out;
}

export const hold = (c: Controls, n: number): Controls[] => Array.from({ length: n }, () => c);
