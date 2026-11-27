/* Le choix d'un coup quand l'adversaire est à portée, selon la distance, la hauteur, ses pourcents
   (smash chargé quand il peut être éjecté) et la précision du niveau. Et la défense. */
import type { Controls } from '../core/input';
import type { Rng } from '../core/rng';
import type { Fighter } from '../fighter/fighter';
import { chargedSmash, ctrl, hold, shortHopAerial, tap } from './inputs';
import type { Profile } from './profile';

/** Pourcents à partir desquels un smash éjecte probablement (selon le poids de la cible). */
const killPercent = (t: Fighter) => 85 + (t.stats.weight - 100) * 0.8;

/** Se protéger : bouclier, esquive sur place, roulade vers le centre, ou saut. */
export function defend(f: Fighter, rng: Rng, p: Profile): Controls[] {
  const center = f.x < 0 ? 1 : -1;
  const r = rng.next();
  if (r < 0.55) return hold(ctrl(0, 0, ['shield']), rng.int(10, 20)).concat(ctrl());
  if (r < 0.7 && p.defense > 0.4) return [ctrl(0, 0, ['shield']), ctrl(0, 1, ['shield']), ctrl()];
  if (r < 0.85) return [ctrl(0, 0, ['shield']), ctrl(center, 0, ['shield']), ctrl()];
  return tap(center, 0, 'jump');
}

/** Un coup au hasard : ce que fait un niveau faible quand il se trompe. */
function sloppy(rng: Rng, toward: number): Controls[] {
  return rng.pick([
    tap(0, 0, 'attack'),
    tap(toward * 0.8, 0, 'attack'),
    tap(0, -0.8, 'attack'),
    chargedSmash(toward, 0, rng.int(0, 10)),
    tap(0, 0, 'special'),
  ]);
}

/** Collé à l'adversaire, à sa hauteur. */
function close(f: Fighter, t: Fighter, rng: Rng, p: Profile, toward: number): Controls[] {
  const turn: Controls[] = f.facing !== toward ? [ctrl(toward * 0.4, 0)] : [];
  const kill = t.percent > killPercent(t) && rng.chance(p.killSense);
  if (kill || t.state === 'shield') {
    const charge = rng.int(0, Math.round(6 + p.killSense * 16));
    const r = rng.next();
    if (r < 0.6) return chargedSmash(toward, 0, charge);
    return r < 0.85 ? chargedSmash(0, 1, charge) : chargedSmash(0, -1, charge);
  }
  const r = rng.next();
  if (r < 0.3) return turn.concat(tap(0, 0, 'attack'), tap(0, 0, 'attack'), tap(0, 0, 'attack'));
  if (r < 0.55) return tap(toward * 0.8, 0, 'attack');
  if (r < 0.7) return tap(0, 0.8, 'attack');
  if (r < 0.82) return tap(0, -0.8, 'attack');
  return chargedSmash(0, 1, rng.int(0, 6));
}

/** Le coup à tenter maintenant, ou null si l'adversaire n'est pas à portée. */
export function attackInRange(f: Fighter, t: Fighter, rng: Rng, p: Profile): Controls[] | null {
  const dx = t.x - f.x;
  const adx = Math.abs(dx);
  const dy = t.cy - f.cy;
  const toward = dx < 0 ? -1 : 1;
  const reach = 62 * f.size + t.width / 2;
  if (!f.grounded) {
    if (adx > 95 || Math.abs(dy) > 95) return null;
    const vertical = Math.abs(dy) > adx;
    return tap(vertical ? 0 : toward, vertical ? Math.sign(dy) : 0, 'attack');
  }
  const inReach = adx < reach && Math.abs(dy) < 60;
  const above = adx < 80 && dy < -60 && dy > -230;
  if (!inReach && !above) return null;
  if (!rng.chance(p.accuracy)) return sloppy(rng, toward);
  if (above) {
    if (t.percent > killPercent(t) && rng.chance(p.killSense)) return chargedSmash(0, -1, rng.int(0, 12));
    return rng.chance(0.5) ? tap(0, -0.8, 'attack') : shortHopAerial(0, 0, -1, 7);
  }
  return close(f, t, rng, p, toward);
}

/** Approche en l'air : saut court puis aérien vers l'adversaire. */
export function jumpIn(f: Fighter, t: Fighter, rng: Rng): Controls[] {
  const toward = t.x < f.x ? -1 : 1;
  return shortHopAerial(toward, rng.chance(0.6) ? toward : 0, 0, rng.int(3, 7));
}
