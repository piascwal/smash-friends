/* États au sol : repos, marche, dash (et « dash dance »), course, accroupi, préparation du saut,
   atterrissage. */
import { approach } from '../core/math';
import { itemInReach, pickUp } from '../items/carry';
import type { World } from '../world';
import { faceStick, startSmash, tryGroundAttack, trySpecial } from './actions';
import { startShield } from './defense';
import type { Fighter } from './fighter';
import { applyFriction, leaveGround } from './physics';

const JUMPSQUAT = 4;
const DASH_FRAMES = 11;

/** Actions possibles depuis un état au sol libre. Renvoie true si une action a démarré. */
export function tryGroundActions(f: Fighter, w: World, running = false): boolean {
  const c = f.ctl;
  if (c.pressed('jump')) {
    c.consume('jump');
    f.setState('jumpsquat', JUMPSQUAT);
    return true;
  }
  if (c.pressed('attack') && !f.item) {
    const it = itemInReach(f, w);
    if (it) {
      c.consume('attack');
      pickUp(f, it, w);
      f.setState('landing', 6);
      return true;
    }
  }
  if (c.held('shield') && !f.item) {
    startShield(f, w);
    return true;
  }
  if (trySpecial(f, w)) return true;
  if (tryGroundAttack(f, w, running)) return true;
  if (f.tapJump && c.tapUp()) {
    f.setState('jumpsquat', JUMPSQUAT);
    return true;
  }
  // passer à travers une plateforme fine
  if (f.platform && !f.platform.solid && c.flickY() === 1) {
    f.dropThrough = 12;
    leaveGround(f);
    f.setState('air');
    f.vy = 2;
    return true;
  }
  return false;
}

function startDash(f: Fighter, w: World, dir: number): void {
  f.facing = dir < 0 ? -1 : 1;
  f.setState('dash', DASH_FRAMES);
  f.vx = f.facing * f.stats.run * 1.05;
  w.emit({ type: 'dash', who: f.slot, x: f.x, y: f.y, dir: f.facing });
}

function updateIdle(f: Fighter, w: World): void {
  const c = f.ctl.cur;
  applyFriction(f, w);
  if (c.y > 0.6) f.setState('crouch');
  else if (f.ctl.flickX() !== 0 || Math.abs(c.x) > 0.85) startDash(f, w, c.x);
  else if (Math.abs(c.x) > 0.25) f.setState('walk');
}

function updateWalk(f: Fighter, w: World): void {
  const c = f.ctl.cur;
  if (Math.abs(c.x) < 0.2) return f.setState('idle');
  if (f.ctl.flickX() !== 0) return startDash(f, w, c.x);
  faceStick(f);
  f.vx = approach(f.vx, c.x * f.stats.walk * 1.4, 0.6);
}

function updateDash(f: Fighter, w: World): void {
  const flick = f.ctl.flickX();
  if (flick !== 0 && flick !== f.facing) return startDash(f, w, flick); // dash dance
  if (f.t >= f.duration) {
    if (Math.abs(f.ctl.cur.x) > 0.5 && Math.sign(f.ctl.cur.x) === f.facing) f.setState('run');
    else f.setState('idle');
  }
}

function updateRun(f: Fighter, w: World): void {
  const c = f.ctl.cur;
  if (c.y > 0.6) return f.setState('crouch');
  if (Math.abs(c.x) < 0.3) return f.setState('idle');
  if (Math.sign(c.x) !== f.facing) {
    // demi-tour en course : on freine puis on repart
    f.facing = c.x < 0 ? -1 : 1;
    f.vx *= 0.3;
  }
  f.vx = approach(f.vx, f.facing * f.stats.run, 0.9 * (w.stage.def.traction ?? 1));
}

function updateJumpsquat(f: Fighter, w: World): void {
  // haut + A : le saut au stick démarre, A le transforme en smash haut (comme dans Melee)
  if (f.ctl.pressed('attack', 3) && f.ctl.cur.y < -0.5 && !f.ctl.held('jump')) {
    f.ctl.consume('attack');
    startSmash(f, w, 0, -1, true);
    return;
  }
  if (f.t < f.duration) return;
  const full = f.ctl.held('jump') || (f.tapJump && f.ctl.cur.y < -0.6);
  leaveGround(f);
  f.vy = -(full ? f.stats.jump : f.stats.shortHop);
  f.vx = Math.max(-f.stats.air * 1.3, Math.min(f.stats.air * 1.3, f.vx * 0.9 + f.ctl.cur.x * 1.5));
  f.setState('air');
  w.emit({ type: 'jump', who: f.slot, x: f.x, y: f.y, air: false });
}

export function updateGround(f: Fighter, w: World): void {
  const s = f.state;
  if (s === 'jumpsquat') return updateJumpsquat(f, w);
  if (s === 'landing') {
    applyFriction(f, w);
    if (f.t >= f.duration) f.setState('idle');
    return;
  }
  if (s === 'crouch') {
    applyFriction(f, w);
    if (tryGroundActions(f, w)) return;
    if (f.ctl.cur.y < 0.5) f.setState('idle');
    return;
  }
  const running = s === 'run' || s === 'dash';
  if (tryGroundActions(f, w, running)) return;
  if (s === 'idle') updateIdle(f, w);
  else if (s === 'walk') updateWalk(f, w);
  else if (s === 'dash') updateDash(f, w);
  else if (s === 'run') updateRun(f, w);
}
