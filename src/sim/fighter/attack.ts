/* Déroulé d'un coup image par image : charge, mouvement imposé, projectile, enchaînement, lancer
   d'objet, fin du coup. Les frappes elles-mêmes sont résolues par combat/hits.ts. */
import { ITEM_THROW_FRAME } from '../moves/items';
import type { World } from '../world';
import { startMove } from './actions';
import { airDrift, checkFastFall } from './air';
import type { Fighter } from './fighter';
import { applyFriction } from './physics';

/** Lâcher l'objet tenu (fourni par le module des objets). */
export type ThrowItemFn = (f: Fighter, w: World) => void;

function chargeHeld(f: Fighter): boolean {
  const ch = f.move!.def.charge!;
  const c = f.ctl;
  if (ch.button === 'smash') {
    return c.held('smash') || c.held('attack') || Math.hypot(c.cur.cx, c.cur.cy) > 0.5;
  }
  return c.held(ch.button);
}

/** Pendant la charge, le coup reste figé ; renvoie true tant qu'on charge. */
function updateCharge(f: Fighter, w: World): boolean {
  const m = f.move!;
  const ch = m.def.charge;
  if (!ch || m.chargeDone || m.frame !== ch.frame) return false;
  if (chargeHeld(f) && m.charge < ch.max) {
    if (m.charge === 0) w.emit({ type: 'charge', who: f.slot });
    m.charge++;
    m.charging = true;
    if (f.grounded) applyFriction(f, w);
    else f.vy = Math.min(f.vy, 2);
    return true;
  }
  m.charging = false;
  m.chargeDone = true;
  return false;
}

function applyMotion(f: Fighter): void {
  const m = f.move!;
  for (const s of m.def.motion ?? []) {
    if (s.frame !== m.frame) continue;
    if (s.vx !== undefined) f.vx = s.vx * f.facing;
    if (s.vy !== undefined) f.vy = s.vy;
  }
}

function endMove(f: Fighter): void {
  const def = f.move!.def;
  if (f.grounded) f.setState('idle');
  else f.setState(def.helpless ? 'helpless' : 'air');
}

export function updateMove(f: Fighter, w: World, throwItem: ThrowItemFn): void {
  const m = f.move;
  if (!m) return f.setState(f.grounded ? 'idle' : 'air');
  if (updateCharge(f, w)) return;
  m.frame++;
  applyMotion(f);
  const def = m.def;
  if (f.grounded) {
    if (!def.motion?.some((s) => s.vx !== undefined && s.frame <= m.frame && m.frame < s.frame + 3))
      applyFriction(f, w);
  } else {
    airDrift(f, def.airControl ?? 1);
    if (def.kind === 'air') checkFastFall(f);
  }
  if (def.projectile && m.frame === def.projectile.frame) w.spawnProjectile(f, def.projectile.id);
  if (def.id === 'itemshoot' && m.frame === def.projectile?.frame && f.item) f.item.ammo--;
  if (def.id === 'itemthrow' && m.frame === ITEM_THROW_FRAME) throwItem(f, w);
  if (def.next && m.frame >= def.next.from && m.frame <= def.next.to && f.ctl.pressed('attack')) {
    f.ctl.consume('attack');
    m.chained = true;
  }
  if (def.next && m.chained && m.frame >= def.next.from + 2) {
    startMove(f, w, def.next.id);
    return;
  }
  if (m.frame >= def.total) endMove(f);
}
