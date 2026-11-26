/* L'IA et les objets : aller les chercher, et s'en servir. */
import type { Controls } from '../core/input';
import type { Rng } from '../core/rng';
import type { Fighter } from '../fighter/fighter';
import type { Item } from '../items/item';
import type { Match } from '../match/match';
import { chargedSmash, ctrl, tap } from './inputs';

export function wantsItem(m: Match, f: Fighter, level: number, rng: Rng): Item | null {
  if (level < 2 || !rng.chance(0.5)) return null;
  const main = m.stage.main;
  const near = m.items.filter(
    (it) =>
      it.holder < 0 &&
      !it.flying &&
      it.spawning <= 0 &&
      it.x > main.x &&
      it.x < main.x + main.w &&
      Math.hypot(it.x - f.x, it.y - f.y) < 320,
  );
  const it = near[0];
  if (!it) return null;
  // trop près pour marcher : on ramasse
  if (Math.abs(it.x - f.x) < 40 && f.grounded) return null;
  return it;
}

export function useItem(f: Fighter, t: Fighter, rng: Rng): Controls[] | null {
  const it = f.item!;
  const dx = t.x - f.x;
  const toward = dx < 0 ? -1 : 1;
  const aligned = Math.abs(t.cy - f.cy) < 70;
  if (it.def.kind === 'melee') {
    if (Math.abs(dx) < 90 && aligned) return chargedSmash(toward, 0, rng.int(0, 15));
    return null;
  }
  if (it.def.kind === 'shooter' && aligned && Math.abs(dx) < 500) {
    return [ctrl(toward * 0.4, 0), ...tap(0, 0, 'attack')];
  }
  if (aligned && Math.abs(dx) < 420) return tap(toward, 0, 'grab');
  return null;
}
