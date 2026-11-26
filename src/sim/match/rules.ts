/* Fin du combat : dernier en lice (vies), ou fin du chrono (temps) avec mort subite en cas d'égalité ;
   classement final. */
import type { Fighter } from '../fighter/fighter';
import type { WinMode } from './config';

/** Équipes encore en jeu (au moins un combattant pas éliminé). */
export function teamsAlive(fighters: readonly Fighter[]): Set<number> {
  return new Set(fighters.filter((f) => !f.eliminated).map((f) => f.team));
}

export function isOver(fighters: readonly Fighter[], mode: WinMode, timeLeft: number): boolean {
  if (mode === 'time' && timeLeft <= 0) return true;
  return teamsAlive(fighters).size <= 1;
}

/** Score d'une équipe en mode temps (somme de ses membres). */
const teamScore = (fighters: readonly Fighter[], team: number) =>
  fighters.filter((f) => f.team === team).reduce((s, f) => s + f.score, 0);

/** Les équipes à égalité en tête au temps (plus d'une : mort subite). */
export function leadingTeams(fighters: readonly Fighter[]): number[] {
  const teams = [...new Set(fighters.map((f) => f.team))];
  const best = Math.max(...teams.map((t) => teamScore(fighters, t)));
  return teams.filter((t) => teamScore(fighters, t) === best);
}

export interface Ranking {
  slot: number;
  place: number;
}

/**
 * Classement : vainqueurs d'abord (équipe gagnante), puis par vies/score, puis par ordre
 * d'élimination (le dernier éliminé est mieux classé). Clés égales : même place.
 */
export function rank(fighters: readonly Fighter[], mode: WinMode, winningTeam: number | null): Ranking[] {
  const key = (f: Fighter) =>
    (f.team === winningTeam ? 1e12 : 0) +
    (mode === 'time' ? f.score + 1000 : f.stocks) * 1e8 +
    (f.eliminated ? f.eliminatedAt : 9e7);
  const sorted = [...fighters].sort((a, b) => key(b) - key(a));
  let place = 0;
  let prev = NaN;
  return sorted.map((f, i) => {
    const k = key(f);
    if (k !== prev) place = i + 1;
    prev = k;
    return { slot: f.slot, place: f.team === winningTeam ? 1 : place };
  });
}
