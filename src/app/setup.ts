/* Ce que le joueur a choisi avant le combat (joueurs, règles, stage), gardé d'une partie à l'autre. */
import type { ItemFrequency } from '../sim/items/spawner';
import { DEFAULT_RULES, type MatchConfig, type WinMode } from '../sim/match/config';
import { ROSTER } from '../sim/roster/characters';
import { STAGES } from '../sim/stage/stages';

export type SlotKind = 'human' | 'cpu' | 'off';

export interface SlotSetup {
  kind: SlotKind;
  charId: string | null;
  cpu: number;
  team: number;
  /** Périphérique du joueur humain. */
  device: string;
}

export interface Rules {
  mode: WinMode;
  stocks: number;
  minutes: number;
  teams: boolean;
  friendlyFire: boolean;
  items: ItemFrequency;
}

export interface Setup {
  slots: SlotSetup[];
  rules: Rules;
  stageId: string;
}

const KEY = 'smash-friends:setup:v1';

export function defaultSetup(touchFirst: boolean): Setup {
  return {
    slots: [
      { kind: 'human', charId: null, cpu: 3, team: 0, device: touchFirst ? 'tactile' : 'clavier' },
      { kind: 'cpu', charId: null, cpu: 3, team: 1, device: 'clavier-d' },
      { kind: 'off', charId: null, cpu: 3, team: 1, device: 'manette-1' },
      { kind: 'off', charId: null, cpu: 3, team: 0, device: 'manette-2' },
    ],
    rules: { ...DEFAULT_RULES },
    stageId: 'random',
  };
}

export function loadSetup(touchFirst: boolean): Setup {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Setup;
      if (s.slots?.length === 4 && s.rules) return s;
    }
  } catch {
    /* préférences illisibles : on repart des valeurs par défaut */
  }
  return defaultSetup(touchFirst);
}

export function saveSetup(s: Setup): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* stockage indisponible (navigation privée) */
  }
}

export const activeSlots = (s: Setup) =>
  s.slots.map((sl, i) => ({ ...sl, slot: i })).filter((sl) => sl.kind !== 'off');

/** Assez de combattants, et au moins deux camps en mode équipes. */
export function ready(s: Setup): boolean {
  const act = activeSlots(s);
  if (act.length < 2 || act.some((a) => !a.charId)) return false;
  return !s.rules.teams || new Set(act.map((a) => a.team)).size >= 2;
}

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!;

export function toMatchConfig(s: Setup): MatchConfig {
  const stageId = s.stageId === 'random' ? pick(STAGES).id : s.stageId;
  return {
    ...s.rules,
    stageId,
    seed: Math.floor(Math.random() * 1e9),
    players: activeSlots(s).map((a) => ({
      slot: a.slot,
      charId: a.charId === 'random' || !a.charId ? pick(ROSTER).id : a.charId,
      team: a.team,
      cpu: a.kind === 'cpu' ? a.cpu : 0,
      name: a.kind === 'cpu' ? 'CPU' : `J${a.slot + 1}`,
      tapJump: !a.device.startsWith('clavier'),
    })),
  };
}
