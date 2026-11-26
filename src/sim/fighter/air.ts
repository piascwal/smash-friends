/* En l'air : dérive, chute rapide, double saut, esquive aérienne, aériens et spéciaux ; et ce qui se
   passe à l'atterrissage selon l'état. */
import { PHYSICS } from '../core/config';
import { approach } from '../core/math';
import { itemInReach, pickUp } from '../items/carry';
import type { Platform } from '../stage/platforms';
import type { World } from '../world';
import { tryAirAttack, trySpecial } from './actions';
import { onHurtLanding } from './damage';
import { startAirdodge } from './defense';
import type { Fighter } from './fighter';
import { land } from './physics';

/** Dérive horizontale en l'air (multipliée pendant certains coups). */
export function airDrift(f: Fighter, control = 1): void {
  const x = f.ctl.cur.x;
  if (Math.abs(x) > 0.15) {
    f.vx = approach(f.vx, x * f.stats.air * Math.max(1, control * 0.9), f.stats.airAccel * control);
  } else f.vx = approach(f.vx, 0, 0.04);
}

/** Chute rapide : stick claqué vers le bas pendant la descente. */
export function checkFastFall(f: Fighter): void {
  if (!f.fastFalling && f.vy >= -1 && f.ctl.flickY() === 1) {
    f.fastFalling = true;
    f.vy = f.stats.fastFall;
  }
}

function tryAirActions(f: Fighter, w: World): boolean {
  const c = f.ctl;
  if ((c.pressed('jump') || (f.tapJump && c.flickY() === -1)) && f.jumpsLeft > 0) {
    c.consume('jump');
    f.jumpsLeft--;
    f.vy = -f.stats.doubleJump;
    f.vx = c.cur.x * f.stats.air;
    f.fastFalling = false;
    if (Math.abs(c.cur.x) > 0.3) f.facing = c.cur.x < 0 ? -1 : 1;
    w.emit({ type: 'jump', who: f.slot, x: f.x, y: f.y, air: true });
    return true;
  }
  if ((c.pressed('grab') || c.pressed('attack')) && !f.item) {
    const it = itemInReach(f, w);
    if (it) {
      c.consume('grab');
      c.consume('attack');
      pickUp(f, it, w);
      return true;
    }
  }
  if (c.pressed('shield') && !f.airdodged && !f.item) {
    c.consume('shield');
    startAirdodge(f);
    return true;
  }
  return trySpecial(f, w) || tryAirAttack(f, w);
}

export function updateAir(f: Fighter, w: World): void {
  if (f.state === 'helpless') {
    airDrift(f, 0.6);
    return;
  }
  if (tryAirActions(f, w)) return;
  airDrift(f);
  checkFastFall(f);
}

/** Lag d'atterrissage d'un aérien, divisé par deux si le bouclier a été pressé juste avant (L-cancel). */
function aerialLandingLag(f: Fighter): number {
  const lag = f.move?.def.landingLag ?? 4;
  return f.ctl.since('shield') <= PHYSICS.lCancelWindow ? Math.ceil(lag / 2) : lag;
}

export function onLand(f: Fighter, w: World, p: Platform): void {
  const speed = f.vy + f.kby;
  const s = f.state;
  if (s === 'hitstun' || s === 'tumble') {
    land(f, p);
    onHurtLanding(f, w, speed);
    return;
  }
  land(f, p);
  w.emit({ type: 'land', who: f.slot, x: f.x, y: f.y, hard: speed > 10 });
  if (s === 'move' && f.move) {
    const def = f.move.def;
    if (def.kind === 'air') return f.setState('landing', aerialLandingLag(f));
    if (def.helpless || def.endOnLanding) return f.setState('landing', def.endOnLanding ? 14 : 18);
    return; // spécial ou objet : le coup continue au sol
  }
  if (s === 'helpless') return f.setState('landing', 14);
  if (s === 'airdodge') return f.setState('landing', 10);
  if (s === 'dizzy') return;
  f.setState('landing', 3);
}
