/* Ramasser, porter et lancer un objet. */
import type { Fighter } from '../fighter/fighter';
import type { World } from '../world';
import type { Item } from './item';

const REACH = 56;

/** L'objet posé le plus proche à portée de main, s'il y en a un. */
export function itemInReach(f: Fighter, w: World): Item | null {
  let best: Item | null = null;
  let bestD = REACH * f.size + 20;
  for (const it of w.items) {
    if (it.holder >= 0 || it.flying || it.spawning > 0 || it.dead) continue;
    if (it.def.kind === 'heal' || it.def.kind === 'star') continue;
    const d = Math.hypot(it.x - f.x, it.y - (f.y - 20));
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best;
}

export function pickUp(f: Fighter, it: Item, w: World): void {
  f.item = it;
  it.holder = f.slot;
  it.flying = false;
  it.vx = it.vy = 0;
  w.emit({ type: 'item', what: 'pickup', x: it.x, y: it.y });
}

/** Position de l'objet dans la main. */
export function holdPosition(f: Fighter, it: Item): void {
  const heavy = it.def.heavy;
  it.x = f.x + f.facing * (heavy ? 10 : 30) * f.size;
  it.y = f.y - (heavy ? 118 : 58) * f.size;
  it.angle = 0;
}

export function dropItem(f: Fighter): void {
  const it = f.item;
  if (!it) return;
  f.item = null;
  it.holder = -1;
  it.vx = f.facing * 2;
  it.vy = -3;
  it.grounded = false;
}

/** Lance l'objet tenu dans la direction visée (force accrue au smash). */
export function throwItem(f: Fighter, w: World): void {
  const it = f.item;
  if (!it) return;
  const { x, y, strong } = f.throwAim;
  const k = (strong ? 1.35 : 1) * (it.def.heavy ? 0.7 : 1);
  f.item = null;
  it.holder = -1;
  it.flying = true;
  it.grounded = false;
  it.thrownBy = f.slot;
  it.thrownTeam = f.team;
  it.hits.clear();
  it.age = Math.min(it.age, 60);
  if (y < -0.5 && Math.abs(y) > Math.abs(x)) {
    it.vx = 0;
    it.vy = -15 * k;
  } else if (y > 0.5 && Math.abs(y) > Math.abs(x)) {
    it.vx = 0;
    it.vy = f.grounded ? -4 : 12;
  } else {
    it.vx = f.facing * 13 * k;
    it.vy = -3.5;
  }
  it.flightTime = 0;
  w.emit({ type: 'item', what: 'throw', x: it.x, y: it.y });
}
