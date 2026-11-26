/* Chopes : on tient l'adversaire, on peut le frapper (pummel) puis le lancer dans une direction.
   La victime se débat (chaque bouton pressé la libère un peu plus vite). */
import type { HitboxDef } from '../moves/types';
import type { World } from '../world';
import { startMove } from './actions';
import type { Fighter } from './fighter';
import { applyFriction } from './physics';

/** Coup appliqué par la chope (pummel, lancer) : fourni par le module de combat. */
export type HitFn = (
  w: World,
  attacker: Fighter,
  victim: Fighter,
  h: HitboxDef,
  dir: number,
  pummel?: boolean,
) => void;

const PUMMEL_DELAY = 16;

export function seize(attacker: Fighter, victim: Fighter, w: World): void {
  attacker.setState('grabbing');
  attacker.partner = victim;
  attacker.vx = 0;
  victim.setState('grabbed');
  victim.partner = attacker;
  victim.facing = -attacker.facing as 1 | -1;
  victim.vx = victim.vy = victim.kbx = victim.kby = 0;
  victim.grabTimer = 80 + victim.percent * 0.9;
  holdVictim(attacker, victim);
  w.emit({ type: 'grab', who: attacker.slot, victim: victim.slot });
}

function holdVictim(a: Fighter, v: Fighter): void {
  v.x = a.x + a.facing * 42 * a.size;
  v.y = a.y - 4;
  v.grounded = a.grounded;
  v.platform = a.platform;
}

/** Libère les deux combattants (fin de chope, ou l'un des deux est frappé). */
export function releaseGrab(f: Fighter): void {
  const p = f.partner;
  f.partner = null;
  if (p && p.partner === f) {
    p.partner = null;
    if (p.state === 'grabbed' || p.state === 'grabbing') p.setState(p.grounded ? 'idle' : 'air');
  }
}

function escape(a: Fighter, v: Fighter): void {
  releaseGrab(a);
  a.setState('landing', 14);
  a.vx = -a.facing * 3;
  v.setState('landing', 10);
  v.vx = a.facing * 4;
}

const THROWS = { forward: 'fthrow', back: 'bthrow', up: 'uthrow', down: 'dthrow' } as const;

export function updateGrabbing(f: Fighter, w: World, hit: HitFn): void {
  const v = f.partner;
  if (!v || v.state !== 'grabbed') {
    f.partner = null;
    return f.setState('idle');
  }
  applyFriction(f, w);
  holdVictim(f, v);
  v.grabTimer--;
  if (v.grabTimer <= 0) return escape(f, v);
  const c = f.ctl;
  const cs = c.cstick();
  const d = cs ? c.direction(f.facing, cs.x, cs.y) : c.direction(f.facing);
  if (d !== 'neutral' && (cs || c.flickX() !== 0 || c.flickY() !== 0 || f.t > 12)) {
    startMove(f, w, THROWS[d]);
    f.partner = v;
    return;
  }
  if (c.pressed('attack') && f.t >= f.pummelReady) {
    c.consume('attack');
    f.pummelReady = f.t + PUMMEL_DELAY;
    hit(
      w,
      f,
      v,
      { start: 0, end: 0, x: 40, y: -50, r: 10, dmg: 2, angle: 0, bkb: 0, kbg: 0 },
      f.facing,
      true,
    );
  }
}

/** Pendant un lancer : la victime suit le lanceur, puis part à l'image de lâcher. */
export function updateThrow(f: Fighter, w: World, hit: HitFn): void {
  const v = f.partner;
  const m = f.move;
  if (!v || !m || v.state !== 'grabbed') return;
  holdVictim(f, v);
  const h = m.def.hitboxes[0];
  if (!h || m.frame < h.start) return;
  f.partner = null;
  v.partner = null;
  hit(w, f, v, h, h.behind ? -f.facing : f.facing);
}

export function updateGrabbed(f: Fighter): void {
  const c = f.ctl;
  // se débattre : chaque appui ou coup de stick rapproche la libération
  if ((c.cur.buttons & ~c.prev.buttons) !== 0 || c.flickX() !== 0 || c.flickY() !== 0) f.grabTimer -= 5;
  if (!f.partner) f.setState(f.grounded ? 'idle' : 'air');
}
