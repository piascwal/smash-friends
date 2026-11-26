/* Déclencher une action : un coup (jab, smash à charger, aérien, spécial selon le stick), ou utiliser
   l'objet tenu. Appelé par les états qui peuvent agir.
   Au sol, direction + A lance un smash : il se charge tant que A est tenu et part au relâché ; un
   simple appui bref donne le coup rapide (tilt) de cette direction. */
import type { World } from '../world';
import type { Direction } from './controls';
import type { Fighter } from './fighter';

export function startMove(f: Fighter, w: World, id: string): void {
  const def = (!f.grounded && f.moves[`${id}_air`]) || f.moves[id];
  if (!def) return;
  f.setState('move');
  f.move = { def, frame: 0, charge: 0, charging: false, chargeDone: false, hits: new Map(), chained: false };
  if (id === 'sspecial') f.sideSpecialUsed = true;
  w.emit({ type: 'move', who: f.slot, sfx: def.sfx ?? 'light', smash: !!def.charge });
}

/** Se tourne vers la direction du stick si elle est franche. */
export function faceStick(f: Fighter, x = f.ctl.cur.x): void {
  if (Math.abs(x) > 0.3) f.facing = x < 0 ? -1 : 1;
}

/** Le stick est-il franchement poussé (smash plutôt que jab) ? */
const strongStick = (x: number, y: number): boolean => Math.max(Math.abs(x), Math.abs(y)) > 0.5;

const SMASH: Record<Direction, string> = {
  up: 'usmash',
  down: 'dsmash',
  forward: 'fsmash',
  back: 'fsmash',
  neutral: 'jab1',
};
const TILT: Record<Direction, string> = {
  up: 'utilt',
  down: 'dtilt',
  forward: 'ftilt',
  back: 'ftilt',
  neutral: 'jab1',
};

function specialSlot(d: Direction): string {
  if (d === 'up') return 'uspecial';
  if (d === 'down') return 'dspecial';
  if (d === 'forward' || d === 'back') return 'sspecial';
  return 'nspecial';
}

/** Spéciaux (au sol comme en l'air) ; avec un objet en main, B le lance. */
export function trySpecial(f: Fighter, w: World): boolean {
  const c = f.ctl;
  if (!c.pressed('special')) return false;
  c.consume('special');
  if (f.item) {
    throwHeld(f, w, c.cur.x, c.cur.y, false);
    return true;
  }
  const d = c.direction(f.facing);
  const slot = specialSlot(d);
  if (slot === 'sspecial') {
    if (!f.grounded && f.sideSpecialUsed) return false;
    faceStick(f);
  }
  if (slot === 'nspecial' || slot === 'dspecial') faceStick(f);
  startMove(f, w, slot);
  return true;
}

/** Smash au sol, chargé tant que A (ou le stick C) reste tenu. */
export function startSmash(f: Fighter, w: World, x: number, y: number, tiltFallback: boolean): void {
  const d = f.ctl.direction(f.facing, x, y);
  if (d === 'forward' || d === 'back') faceStick(f, x);
  startMove(f, w, SMASH[d]);
  if (tiltFallback && f.move) f.move.tilt = TILT[d];
}

/** Attaques au sol : smash (direction + A), jab, attaque en course. */
export function tryGroundAttack(f: Fighter, w: World, running: boolean): boolean {
  const c = f.ctl;
  if (f.item && tryItemUse(f, w)) return true;
  const cs = c.cstick();
  if (cs) {
    startSmash(f, w, cs.x, cs.y, false);
    return true;
  }
  if (!c.pressed('attack')) return false;
  c.consume('attack');
  if (running) startMove(f, w, 'dash');
  else if (strongStick(c.cur.x, c.cur.y)) startSmash(f, w, c.cur.x, c.cur.y, true);
  else startMove(f, w, 'jab1');
  return true;
}

/** Aériens : la direction donne le coup (avant, arrière, haut, bas, neutre). */
export function tryAirAttack(f: Fighter, w: World): boolean {
  if (f.item && tryItemUse(f, w)) return true;
  const c = f.ctl;
  let dir = c.cstick();
  if (!dir && c.pressed('attack')) {
    c.consume('attack');
    dir = { x: c.cur.x, y: c.cur.y };
  }
  if (!dir) return false;
  const d = c.direction(f.facing, dir.x, dir.y);
  const slot = { neutral: 'nair', forward: 'fair', back: 'bair', up: 'uair', down: 'dair' }[d];
  startMove(f, w, slot);
  return true;
}

function throwHeld(f: Fighter, w: World, x: number, y: number, strong: boolean): void {
  f.throwAim = { x, y, strong: strong || Math.hypot(x, y) > 0.9 };
  faceStick(f, x);
  startMove(f, w, 'itemthrow');
}

/** Objet tenu et A : frapper avec (smash si direction), tirer, ou le lancer. */
function tryItemUse(f: Fighter, w: World): boolean {
  const c = f.ctl;
  const item = f.item!;
  const cs = c.cstick();
  if (!cs && !c.pressed('attack')) return false;
  c.consume('attack');
  const x = cs?.x ?? c.cur.x;
  const y = cs?.y ?? c.cur.y;
  const kind = item.def.kind;
  if (kind === 'melee') {
    if (f.grounded && (cs || strongStick(x, y))) {
      faceStick(f, x);
      startMove(f, w, 'itemsmash');
    } else startMove(f, w, 'itemswing');
    return true;
  }
  if (kind === 'shooter' && item.ammo > 0 && !cs) {
    startMove(f, w, 'itemshoot');
    return true;
  }
  throwHeld(f, w, x, y, !!cs);
  return true;
}
