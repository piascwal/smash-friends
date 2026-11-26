/* L'IA sur le stage : choisir sa cible, se défendre, choisir un coup selon la distance, la hauteur et
   les pourcents de la cible (smash chargé pour éjecter, aériens pour enchaîner…). */
import type { Controls } from '../core/input';
import type { Rng } from '../core/rng';
import { activeHitboxes } from '../combat/hits';
import type { Fighter } from '../fighter/fighter';
import type { Match } from '../match/match';
import { chargedSmash, ctrl, hold, shortHopAerial, tap } from './inputs';

export function pickTarget(m: Match, f: Fighter): Fighter | null {
  let best: Fighter | null = null;
  let bestScore = Infinity;
  for (const o of m.fighters) {
    if (o === f || o.team === f.team || !o.alive || o.state === 'respawn') continue;
    // préfère les cibles proches, et un peu celles qui ont beaucoup de pourcents
    const score = Math.hypot(o.x - f.x, o.y - f.y) - o.percent * 0.8 + (o.invincible > 0 ? 400 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best;
}

/** Un coup ou un projectile ennemi arrive-t-il sur nous ? */
export function threatened(m: Match, f: Fighter): boolean {
  for (const o of m.fighters) {
    if (o.team === f.team || !o.move) continue;
    const d = Math.hypot(o.x - f.x, o.y - f.y);
    if (d > 150 * o.size) continue;
    const m0 = o.move;
    const soon = m0.def.hitboxes.some((h) => h.start - m0.frame <= 8 && h.end >= m0.frame);
    if (soon || activeHitboxes(o).length) return true;
  }
  return m.projectiles.some(
    (p) =>
      p.team !== f.team &&
      Math.hypot(p.x - f.cx, p.y - f.cy) < 160 &&
      Math.sign(f.x - p.x) === Math.sign(p.vx || 1),
  );
}

export function defend(f: Fighter, rng: Rng): Controls[] {
  const away = f.x < 0 ? 1 : -1;
  const r = rng.next();
  if (r < 0.5) return hold(ctrl(0, 0, ['shield']), rng.int(8, 18)).concat([ctrl()]);
  if (r < 0.7) return [ctrl(0, 0, ['shield']), ctrl(0, 1, ['shield']), ctrl()];
  if (r < 0.85) return [ctrl(0, 0, ['shield']), ctrl(away, 0, ['shield']), ctrl()];
  return tap(away, 0, 'jump');
}

function closeRange(f: Fighter, t: Fighter, rng: Rng, level: number, toward: number): Controls[] {
  const killable = t.percent > 118 - level * 3;
  if (t.state === 'shield' || t.state === 'shieldstun') return chargedSmash(toward, 0, rng.int(10, 30));
  if (killable && rng.chance(0.55)) {
    const r = rng.next();
    const charge = rng.int(0, 6 + level * 2);
    if (r < 0.6) return chargedSmash(toward, 0, charge);
    if (r < 0.85) return chargedSmash(0, 1, charge);
    return chargedSmash(0, -1, charge);
  }
  const turn: Controls[] = f.facing !== toward ? [ctrl(toward * 0.5, 0)] : [];
  const r = rng.next();
  if (r < 0.28) return turn.concat(tap(0, 0, 'attack'), tap(0, 0, 'attack'), tap(0, 0, 'attack'));
  if (r < 0.5) return tap(toward * 0.6, 0, 'attack');
  if (r < 0.66) return tap(toward * 0.8, 0, 'attack');
  if (r < 0.78) return tap(0, 0.7, 'attack');
  if (r < 0.9) return chargedSmash(0, 1, rng.int(0, 8));
  return tap(0, 0, 'special');
}

/** Distance jusqu'au bord du stage principal dans la direction donnée. */
function roomAhead(m: Match, f: Fighter, dir: number): number {
  const p = m.stage.main;
  return dir > 0 ? p.x + p.w - f.x : f.x - p.x;
}

/** En l'air : l'aérien orienté vers la cible, si elle est à portée. */
function airAttack(adx: number, dy: number, toward: number): Controls[] | null {
  if (adx >= 90 || Math.abs(dy) >= 90) return null;
  const vertical = Math.abs(dy) > adx;
  return tap(vertical ? 0 : toward, vertical ? Math.sign(dy) : 0, 'attack');
}

/** Le coup à tenter, ou null si mieux vaut se rapprocher. */
export function chooseAttack(m: Match, f: Fighter, t: Fighter, rng: Rng, level: number): Controls[] | null {
  const dx = t.x - f.x;
  const adx = Math.abs(dx);
  const dy = t.cy - f.cy;
  const toward = dx < 0 ? -1 : 1;
  const reach = 70 * f.size;
  if (!f.grounded) return airAttack(adx, dy, toward);
  if (adx < reach && Math.abs(dy) < 55) return closeRange(f, t, rng, level, toward);
  if (adx < 90 && dy < -60 && dy > -220) {
    if (t.percent > 100 && rng.chance(0.5)) return chargedSmash(0, -1, rng.int(0, 12));
    return rng.chance(0.5) ? tap(0, -0.7, 'attack') : shortHopAerial(0, 0, -1, 8);
  }
  if (adx < 240 && dy < -40 && !t.grounded) return shortHopAerial(toward, 0, -1, 10);
  if (adx < 230) {
    const r = rng.next();
    if (r < 0.32) return shortHopAerial(toward, rng.chance(0.6) ? toward : 0, 0, 4);
    if (r < 0.5 && adx > 120) return [...hold(ctrl(toward, 0), 6), ...tap(toward, 0, 'attack')];
    if (r < 0.62 && Math.abs(dy) < 50 && roomAhead(m, f, toward) > 260) return tap(toward, 0, 'special');
    return null;
  }
  if (Math.abs(dy) < 50 && rng.chance(0.25 + level * 0.02)) return tap(0, 0, 'special');
  return null;
}
