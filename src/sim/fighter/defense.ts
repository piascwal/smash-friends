/* Défense : bouclier (qui s'use et peut casser), roulades, esquive sur place, esquive aérienne
   directionnelle, et l'étourdissement après un bouclier brisé. */
import { SHIELD } from '../core/config';
import type { World } from '../world';
import { startMove } from './actions';
import type { Fighter } from './fighter';
import { applyFriction, leaveGround } from './physics';

const ROLL = 28;
const SPOTDODGE = 22;
const AIRDODGE = 30;
const DIZZY = 260;

export function startShield(f: Fighter, w: World): void {
  f.setState('shield');
  applyFriction(f, w, 2);
}

function startRoll(f: Fighter, dir: number): void {
  f.setState('roll', ROLL);
  f.rollDir = dir < 0 ? -1 : 1;
  f.intangible = 16;
}

/** Bouclier tenu : options « hors bouclier » (saut, chope, roulade, esquive). */
function updateShield(f: Fighter, w: World): void {
  const c = f.ctl;
  applyFriction(f, w, 2);
  f.shield -= SHIELD.decay;
  if (f.shield <= 0) return breakShield(f, w);
  if (c.pressed('jump') || (f.tapJump && c.flickY() === -1)) {
    c.consume('jump');
    f.setState('jumpsquat', 4);
    return;
  }
  if (c.pressed('grab') || c.pressed('attack')) {
    c.consume('grab');
    c.consume('attack');
    startMove(f, w, 'grab');
    return;
  }
  const fx = c.flickX();
  if (fx !== 0) return startRoll(f, fx);
  if (c.flickY() === 1) {
    f.setState('spotdodge', SPOTDODGE);
    f.intangible = 14;
    return;
  }
  if (!c.held('shield')) f.setState('shieldrelease', SHIELD.release);
}

export function breakShield(f: Fighter, w: World): void {
  f.shield = SHIELD.max * 0.4;
  leaveGround(f);
  f.vy = -15;
  f.vx = 0;
  f.setState('dizzy', DIZZY);
  w.emit({ type: 'shieldBreak', who: f.slot, x: f.x, y: f.cy });
}

export function startAirdodge(f: Fighter): void {
  const c = f.ctl.cur;
  f.airdodged = true;
  f.setState('airdodge', AIRDODGE);
  f.intangible = 20;
  f.fastFalling = false;
  const m = Math.hypot(c.x, c.y);
  if (m > 0.3) {
    f.vx = (c.x / m) * 10;
    f.vy = (c.y / m) * 10;
  } else {
    f.vx *= 0.4;
    f.vy = 0;
  }
}

export function updateDefense(f: Fighter, w: World): void {
  switch (f.state) {
    case 'shield':
      return updateShield(f, w);
    case 'shieldstun':
      applyFriction(f, w);
      if (f.t >= f.duration) f.setState(f.ctl.held('shield') ? 'shield' : 'shieldrelease', SHIELD.release);
      return;
    case 'shieldrelease':
    case 'spotdodge':
      applyFriction(f, w, 2);
      if (f.t >= f.duration) f.setState('idle');
      return;
    case 'roll':
      f.vx = f.t >= 3 && f.t <= 20 ? f.rollDir * 6.5 : 0;
      if (f.t >= f.duration) {
        f.facing = -f.rollDir as 1 | -1;
        f.setState('idle');
      }
      return;
    case 'airdodge':
      f.vx *= 0.9;
      f.vy *= 0.9;
      if (f.t >= f.duration) f.setState('air');
      return;
    case 'dizzy':
      if (f.grounded) applyFriction(f, w);
      // marteler les boutons fait reprendre ses esprits plus vite
      if (f.ctl.cur.buttons !== 0 && f.ctl.prev.buttons === 0) f.duration -= 6;
      if (f.t >= f.duration) f.setState(f.grounded ? 'idle' : 'air');
      return;
  }
}

/** Recharge du bouclier quand il n'est pas levé. */
export function regenShield(f: Fighter): void {
  if (f.state !== 'shield' && f.state !== 'shieldstun')
    f.shield = Math.min(SHIELD.max, f.shield + SHIELD.regen);
}
