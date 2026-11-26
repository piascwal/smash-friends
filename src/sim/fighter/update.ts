/* Une image d'un combattant : lecture des commandes, minuteurs, état courant, physique, rebords. */
import type { Controls } from '../core/input';
import type { World } from '../world';
import { onLand, updateAir } from './air';
import { updateMove, type ThrowItemFn } from './attack';
import { applyLaunch, updateDamageStates } from './damage';
import { regenShield, updateDefense } from './defense';
import type { Fighter, StateId } from './fighter';
import { updateGround } from './ground';
import { checkLedgeGrab, updateLedge } from './ledge';
import { stepPhysics } from './physics';

/** Les fonctions d'objets dont un combattant a besoin (injectées par le match). */
export interface FighterHooks {
  throwItem: ThrowItemFn;
}

const GROUND = new Set<StateId>(['idle', 'walk', 'dash', 'run', 'crouch', 'jumpsquat', 'landing']);
const DEFENSE = new Set<StateId>([
  'shield',
  'shieldstun',
  'shieldrelease',
  'roll',
  'spotdodge',
  'airdodge',
  'dizzy',
]);
const DAMAGE = new Set<StateId>(['hitstun', 'tumble', 'knockdown', 'getup', 'tech']);
const NO_PHYSICS = new Set<StateId>(['ledge', 'dead', 'respawn']);
/** États au sol qui passent en chute quand le sol se dérobe. */
const FALLS_OFF = new Set<StateId>(['walk', 'dash', 'run', 'idle', 'crouch', 'landing', 'shieldrelease']);

function tickTimers(f: Fighter): void {
  if (f.intangible > 0) f.intangible--;
  if (f.invincible > 0) f.invincible--;
  if (f.starPower > 0) f.starPower--;
  if (f.regrab > 0) f.regrab--;
  if (f.frozen > 0) f.frozen--;
  regenShield(f);
}

function updateState(f: Fighter, w: World, hooks: FighterHooks): void {
  const s = f.state;
  if (GROUND.has(s)) return updateGround(f, w);
  if (s === 'air' || s === 'helpless') return updateAir(f, w);
  if (DEFENSE.has(s)) return updateDefense(f, w);
  if (DAMAGE.has(s)) return updateDamageStates(f, w);
  if (s === 'ledge') return updateLedge(f, w);
  if (s === 'move') return updateMove(f, w, hooks.throwItem);
}

export function updateFighter(f: Fighter, w: World, input: Controls, hooks: FighterHooks): void {
  f.ctl.update(input);
  if (f.state === 'dead' || f.state === 'respawn' || f.state === 'win') return;
  tickTimers(f);
  if (f.hitlag > 0) {
    f.hitlag--;
    if (f.hitlag > 0) return;
    applyLaunch(f);
  }
  f.t++;
  updateState(f, w, hooks);
  if (NO_PHYSICS.has(f.state)) return;
  const res = stepPhysics(f, w);
  if (res.landed) onLand(f, w, res.landed);
  else if (res.leftGround && FALLS_OFF.has(f.state)) f.setState('air');
  if (!f.grounded) checkLedgeGrab(f, w);
}
