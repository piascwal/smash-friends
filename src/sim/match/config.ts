/* Réglages d'un combat, choisis à l'écran de sélection. */
import type { ItemFrequency } from '../items/spawner';

export interface PlayerConfig {
  /** Emplacement 0 à 3 (couleur, place dans le HUD). */
  slot: number;
  charId: string;
  /** Équipe (mode équipes) ; en chacun pour soi, chaque joueur est sa propre équipe. */
  team: number;
  /** 0 : humain ; 1 à 9 : niveau de l'IA. */
  cpu: number;
  name: string;
  /** Sauter en poussant le stick vers le haut (pratique à la manette, pas au clavier). */
  tapJump?: boolean;
}

export type WinMode = 'stock' | 'time';

export interface MatchConfig {
  stageId: string;
  players: PlayerConfig[];
  mode: WinMode;
  stocks: number;
  minutes: number;
  teams: boolean;
  friendlyFire: boolean;
  items: ItemFrequency;
  seed: number;
}

export const DEFAULT_RULES: Omit<MatchConfig, 'stageId' | 'players' | 'seed'> = {
  mode: 'stock',
  stocks: 3,
  minutes: 3,
  teams: false,
  friendlyFire: false,
  items: 'mid',
};

/** Équipe effective : en chacun pour soi, l'emplacement fait office d'équipe. */
export const effectiveTeam = (p: PlayerConfig, teams: boolean): number => (teams ? p.team : p.slot);
