/* Déclencher une action : un coup (avec choix tilt / smash / aérien / spécial selon le stick),
   un saut, une chope. Appelé par les états qui peuvent agir. */
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

/** Smash demandé : bouton smash, stick C, ou attaque avec le stick claqué. Renvoie sa direction. */
function smashInput(f: Fighter): { x: number; y: number } | null {
  const c = f.ctl;
  const cs = c.cstick();
  if (cs) return cs;
  if (c.pressed('smash')) {
    c.consume('smash');
    return { x: c.cur.x, y: c.cur.y };
  }
  if (c.pressed('attack', 2) && (c.flickX() !== 0 || c.flickY() !== 0)) {
    c.consume('attack');
    return { x: c.cur.x, y: c.cur.y };
  }
  return null;
}

const smashSlot = (d: Direction): string => (d === 'up' ? 'usmash' : d === 'down' ? 'dsmash' : 'fsmash');

function specialSlot(d: Direction): string {
  if (d === 'up') return 'uspecial';
  if (d === 'down') return 'dspecial';
  if (d === 'forward' || d === 'back') return 'sspecial';
  return 'nspecial';
}

/** Spéciaux (au sol comme en l'air). */
export function trySpecial(f: Fighter, w: World): boolean {
  const c = f.ctl;
  if (!c.pressed('special')) return false;
  c.consume('special');
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

/** Attaques au sol : smash, inclinaisons, jab, attaque en course. */
export function tryGroundAttack(f: Fighter, w: World, running: boolean): boolean {
  if (f.item && tryItemUse(f, w)) return true;
  const sm = smashInput(f);
  if (sm) {
    const d = f.ctl.direction(f.facing, sm.x, sm.y);
    if (d === 'forward' || d === 'back') faceStick(f, sm.x);
    startMove(f, w, smashSlot(d));
    return true;
  }
  if (!f.ctl.pressed('attack')) return false;
  f.ctl.consume('attack');
  if (running) {
    startMove(f, w, 'dash');
    return true;
  }
  const d = f.ctl.direction(f.facing);
  if (d === 'up') startMove(f, w, 'utilt');
  else if (d === 'down') startMove(f, w, 'dtilt');
  else if (d === 'forward' || d === 'back') {
    faceStick(f);
    startMove(f, w, 'ftilt');
  } else startMove(f, w, 'jab1');
  return true;
}

/** Aériens : la direction donne le coup (avant, arrière, haut, bas, neutre). */
export function tryAirAttack(f: Fighter, w: World): boolean {
  if (f.item && tryItemUse(f, w)) return true;
  const c = f.ctl;
  let dir = c.cstick();
  if (!dir && (c.pressed('attack') || c.pressed('smash'))) {
    c.consume('attack');
    c.consume('smash');
    dir = { x: c.cur.x, y: c.cur.y };
  }
  if (!dir) return false;
  const d = c.direction(f.facing, dir.x, dir.y);
  const slot = { neutral: 'nair', forward: 'fair', back: 'bair', up: 'uair', down: 'dair' }[d];
  startMove(f, w, slot);
  return true;
}

/** Objet tenu : frapper avec, tirer, ou le lancer. */
function tryItemUse(f: Fighter, w: World): boolean {
  const c = f.ctl;
  const item = f.item!;
  const sm = c.cstick() ?? (c.pressed('smash') ? { x: c.cur.x, y: c.cur.y } : null);
  const attack = c.pressed('attack');
  const toss = c.pressed('grab');
  if (!sm && !attack && !toss) return false;
  for (const b of ['attack', 'smash', 'grab'] as const) c.consume(b);
  const kind = item.def.kind;
  if (kind === 'melee' && !toss) {
    startMove(f, w, sm ? 'itemsmash' : 'itemswing');
    return true;
  }
  if (kind === 'shooter' && attack && !sm && item.ammo > 0) {
    startMove(f, w, 'itemshoot');
    return true;
  }
  const dx = sm ? sm.x : c.cur.x;
  const dy = sm ? sm.y : c.cur.y;
  f.throwAim = { x: dx, y: dy, strong: !!sm || Math.hypot(dx, dy) > 0.9 };
  faceStick(f, dx);
  startMove(f, w, 'itemthrow');
  return true;
}
