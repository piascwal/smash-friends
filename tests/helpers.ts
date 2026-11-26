/* Outils de test : un combat prêt à jouer, sans navigateur. */
import { CpuBrain } from '../src/sim/ai/brain';
import { DEFAULT_RULES, type MatchConfig, type PlayerConfig } from '../src/sim/match/config';
import { Match } from '../src/sim/match/match';

export function player(slot: number, charId: string, cpu = 0, team = slot): PlayerConfig {
  return { slot, charId, cpu, team, name: `J${slot + 1}` };
}

export function makeMatch(players: PlayerConfig[], over: Partial<MatchConfig> = {}): Match {
  const config: MatchConfig = { ...DEFAULT_RULES, stageId: 'calanques', players, seed: 42, ...over };
  const brains = players.map((p) => (p.cpu > 0 ? new CpuBrain(p.cpu, config.seed + p.slot * 7919) : null));
  return new Match(config, brains);
}

/** Passe le compte à rebours. */
export function skipCountdown(m: Match): void {
  while (m.phase === 'countdown') m.step([]);
}
