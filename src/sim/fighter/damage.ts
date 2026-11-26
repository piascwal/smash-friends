/* Après un coup : éjection (avec influence directionnelle), étourdissement, vrille, récupération au
   sol (tech), mise au sol et relevé. */
import { PHYSICS } from '../core/config';
import { applyDI, launchVelocity } from '../combat/knockback';
import type { World } from '../world';
import { startMove } from './actions';
import { airDrift, checkFastFall, updateAir } from './air';
import type { Fighter } from './fighter';
import { applyFriction, leaveGround } from './physics';

const KNOCKDOWN_MAX = 70;
const GETUP = 26;
const TECH = 26;

/** Fin de l'arrêt sur image : la cible part, déviée par son stick (DI). */
export function applyLaunch(f: Fighter): void {
  const l = f.pendingLaunch;
  f.pendingLaunch = null;
  if (!l) return;
  const c = f.ctl.cur;
  const angle = applyDI(l.angle, c.x, -c.y);
  const v = launchVelocity(l.kb, angle, 1);
  f.kbx = v.vx;
  f.kby = v.vy;
  f.vx = 0;
  f.vy = 0;
  // une petite éjection à plat garde au sol ; le reste décolle
  if (f.grounded && (v.vy < -0.5 || l.kb >= PHYSICS.tumbleThreshold)) {
    leaveGround(f);
    if (f.kby > 0) f.kby = -f.kby * 0.8; // un météore au sol rebondit
  }
  f.spin = 0;
}

export function updateHurt(f: Fighter, w: World): void {
  f.hitstun--;
  if (f.state === 'tumble') f.spin += Math.hypot(f.kbx, f.kby) * 1.2 + 4;
  if (f.hitstun > 0) {
    if (f.grounded) applyFriction(f, w);
    return;
  }
  if (f.grounded) return f.setState('idle');
  if (f.state === 'hitstun') return f.setState('air');
  // en vrille, on peut agir dès la fin de l'étourdissement
  const before = f.state;
  updateAir(f, w);
  if (f.state === before) {
    airDrift(f, 0.8);
    checkFastFall(f);
  }
}

/** Atterrissage pendant un étourdissement : récupération si le bouclier vient d'être pressé. */
export function onHurtLanding(f: Fighter, w: World, speed: number): void {
  const tumbling = f.state === 'tumble';
  if (!tumbling && speed < 6) {
    // petit coup : on reste étourdi debout
    if (f.hitstun <= 0) f.setState('landing', 4);
    return;
  }
  if (f.ctl.since('shield') <= PHYSICS.techWindow) {
    const dir = Math.abs(f.ctl.cur.x) > 0.5 ? Math.sign(f.ctl.cur.x) : 0;
    f.setState('tech', TECH);
    f.rollDir = dir < 0 ? -1 : 1;
    f.techRoll = dir !== 0;
    f.intangible = 20;
    f.kbx = 0;
    f.hitstun = 0;
    w.emit({ type: 'tech', who: f.slot, x: f.x, y: f.y });
    return;
  }
  f.kbx *= 0.4;
  f.hitstun = 0;
  f.setState('knockdown', KNOCKDOWN_MAX);
  w.emit({ type: 'land', who: f.slot, x: f.x, y: f.y, hard: true });
}

function updateKnockdown(f: Fighter, w: World): void {
  applyFriction(f, w, 1.5);
  if (f.t < 12) return;
  const c = f.ctl;
  if (c.pressed('attack') || c.pressed('special')) {
    c.consume('attack');
    c.consume('special');
    startMove(f, w, 'getup');
    return;
  }
  const fx = c.flickX() || (Math.abs(c.cur.x) > 0.7 ? Math.sign(c.cur.x) : 0);
  if (fx !== 0) {
    f.setState('roll', 28);
    f.rollDir = fx < 0 ? -1 : 1;
    f.intangible = 18;
    return;
  }
  if (c.pressed('jump') || c.cur.y < -0.6 || f.t >= f.duration) {
    c.consume('jump');
    f.setState('getup', GETUP);
    f.intangible = 20;
  }
}

export function updateDamageStates(f: Fighter, w: World): void {
  switch (f.state) {
    case 'hitstun':
    case 'tumble':
      return updateHurt(f, w);
    case 'knockdown':
      return updateKnockdown(f, w);
    case 'getup':
      applyFriction(f, w);
      if (f.t >= f.duration) f.setState('idle');
      return;
    case 'tech':
      f.vx = f.techRoll && f.t >= 3 && f.t <= 18 ? f.rollDir * 6 : 0;
      if (!f.techRoll) applyFriction(f, w);
      if (f.t >= f.duration) f.setState('idle');
      return;
  }
}
