/* Rebords : on s'y accroche en revenant sur le stage (un seul combattant par rebord : le « ledge hog »),
   puis on remonte, saute, attaque, roule ou lâche. */
import { LEDGE } from '../core/config';
import { ledgeX, ledgeY, type Ledge } from '../stage/platforms';
import type { World } from '../world';
import { startMove } from './actions';
import type { Fighter } from './fighter';
import { land, leaveGround } from './physics';

/** Peut-il saisir un rebord dans cet état ? */
function canGrab(f: Fighter): boolean {
  if (f.grounded || f.regrab > 0 || f.item?.def.heavy) return false;
  const s = f.state;
  if (s === 'move') return !!f.move?.def.ledgeGrab && f.move.frame > 8;
  if (s === 'tumble') return f.hitstun <= 0 && f.vy + f.kby >= 0;
  return (s === 'air' || s === 'helpless' || s === 'airdodge') && f.vy + f.kby >= 0;
}

const occupied = (w: World, l: Ledge, self: Fighter): boolean =>
  w.fighters.some((o) => o !== self && o.state === 'ledge' && o.ledge === l);

/** Saisit un rebord à portée de main, s'il y en a un. */
export function checkLedgeGrab(f: Fighter, w: World): boolean {
  if (!canGrab(f)) return false;
  for (const l of w.stage.ledges) {
    const lx = ledgeX(l);
    const ly = ledgeY(l);
    const reach = 46 * f.size;
    const dx = (f.x - lx) * l.side; // > 0 : à l'extérieur du stage
    if (dx < -14 || dx > reach) continue;
    const hands = f.y - 100 * f.size;
    if (ly < hands - 30 || ly > f.y - 30 * f.size) continue;
    if (occupied(w, l, f)) continue;
    grab(f, w, l);
    return true;
  }
  return false;
}

function grab(f: Fighter, w: World, l: Ledge): void {
  f.setState('ledge');
  f.ledge = l;
  f.facing = -l.side as 1 | -1;
  f.x = ledgeX(l) + l.side * f.width * 0.4;
  f.y = ledgeY(l) + 78 * f.size;
  f.vx = f.vy = f.kbx = f.kby = 0;
  f.fastFalling = false;
  if (f.ledgeInvincibleReady) f.intangible = LEDGE.invincible;
  f.ledgeInvincibleReady = false;
  f.resetAirOptions();
  w.emit({ type: 'ledge', who: f.slot, x: ledgeX(l), y: ledgeY(l) });
}

function release(f: Fighter): void {
  f.ledge = null;
  f.regrab = LEDGE.regrabDelay;
}

/** Remonte sur le stage, juste derrière le bord. */
function climbOnto(f: Fighter, l: Ledge, inward: number): void {
  f.x = ledgeX(l) - l.side * inward;
  land(f, l.platform);
  release(f);
}

export function updateLedge(f: Fighter, w: World): void {
  const l = f.ledge;
  if (!l) return f.setState('air');
  f.x = ledgeX(l) + l.side * f.width * 0.4;
  f.y = ledgeY(l) + 78 * f.size;
  if (f.t < 8) return;
  const c = f.ctl;
  const toward = c.cur.x * f.facing;
  if (c.pressed('jump') || c.tapUp()) {
    c.consume('jump');
    release(f);
    leaveGround(f);
    f.setState('air');
    f.y -= 30 * f.size;
    f.vy = -f.stats.jump * 0.95;
    f.vx = f.facing * 2;
    f.intangible = Math.max(f.intangible, 4);
    w.emit({ type: 'jump', who: f.slot, x: f.x, y: f.y, air: true });
    return;
  }
  if (c.pressed('attack') || c.pressed('special')) {
    c.consume('attack');
    c.consume('special');
    climbOnto(f, l, f.width * 0.7);
    startMove(f, w, 'ledge');
    return;
  }
  if (c.pressed('shield')) {
    c.consume('shield');
    climbOnto(f, l, f.width * 0.6);
    f.setState('roll', 30);
    f.rollDir = f.facing;
    f.intangible = 22;
    return;
  }
  if (toward > 0.6 || c.cur.y < -0.7) {
    climbOnto(f, l, f.width * 0.6);
    f.setState('getup', 24);
    f.intangible = 22;
    return;
  }
  if (toward < -0.6 || c.cur.y > 0.7 || f.t > LEDGE.max) {
    release(f);
    f.setState('air');
    f.x += l.side * 10;
    f.vy = 1;
  }
}
