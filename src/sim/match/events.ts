/* Ce qui se passe pendant une image et que le rendu, le son et le HUD montrent : coups, éjections,
   sauts… La simulation les émet ; elle ne dessine rien elle-même. */
import type { Effect } from '../moves/types';

export type BlastSide = 'left' | 'right' | 'top' | 'bottom';

export type GameEvent =
  | {
      type: 'hit';
      x: number;
      y: number;
      damage: number;
      kb: number;
      effect: Effect;
      attacker: number;
      victim: number;
      /** Le coup va très probablement éjecter (cinématique du coup fatal). */
      fatal: boolean;
      angle: number;
    }
  | { type: 'shield'; x: number; y: number; victim: number; damage: number }
  | { type: 'shieldBreak'; who: number; x: number; y: number }
  | { type: 'clank'; x: number; y: number }
  | { type: 'ko'; who: number; x: number; y: number; side: BlastSide; star: boolean; by: number }
  | { type: 'jump'; who: number; x: number; y: number; air: boolean }
  | { type: 'land'; who: number; x: number; y: number; hard: boolean }
  | { type: 'dash'; who: number; x: number; y: number; dir: number }
  | { type: 'move'; who: number; sfx: string; smash: boolean }
  | { type: 'charge'; who: number }
  | { type: 'tech'; who: number; x: number; y: number }
  | { type: 'ledge'; who: number; x: number; y: number }
  | { type: 'counter'; who: number; x: number; y: number }
  | { type: 'reflect'; x: number; y: number }
  | { type: 'grab'; who: number; victim: number }
  | { type: 'item'; what: 'spawn' | 'pickup' | 'throw' | 'heal' | 'star' | 'break'; x: number; y: number }
  | { type: 'explosion'; x: number; y: number; r: number }
  | { type: 'respawn'; who: number }
  | { type: 'countdown'; n: number }
  | { type: 'go' }
  | { type: 'game' }
  | { type: 'suddenDeath' };
