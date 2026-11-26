/* Appliquer une frappe : pourcents, éjection (Melee), arrêt sur image, étourdissement ; ou bien
   frappe sur bouclier, ou déclenchement d'un contre. */
import { PHYSICS } from '../core/config';
import { startMove } from '../fighter/actions';
import { breakShield } from '../fighter/defense';
import type { Fighter } from '../fighter/fighter';
import { dropItem } from '../items/carry';
import type { Effect } from '../moves/types';
import type { World } from '../world';
import { hitlagFrames, hitstunFrames, knockback, resolveAngle } from './knockback';
import { predictKO } from './predict';

export interface HitSpec {
  dmg: number;
  angle: number;
  bkb: number;
  kbg: number;
  wkb?: number;
  effect?: Effect;
}

export interface HitContext {
  /** Numéro de l'auteur (-1 : personne, ex. baril). */
  by: number;
  /** Combattant qui frappe au corps à corps (il partage l'arrêt sur image). */
  attacker?: Fighter;
  /** Point d'impact (effets). */
  x: number;
  y: number;
  /** Sens de l'éjection : 1 vers la droite, -1 vers la gauche. */
  dir: number;
}

const mirror = (angle: number, dir: number) => (dir < 0 ? 180 - angle : angle);

/** Coups multiples « aimantés » (angle 365) : la victime suit le coup sans être éjectée. */
function drag(victim: Fighter, ctx: HitContext): void {
  const a = ctx.attacker;
  victim.kbx = (a ? a.vx : 0) + (ctx.x - victim.x) * 0.12;
  victim.kby = (a ? a.vy : 0) + (ctx.y - victim.cy) * 0.12;
  victim.vx = victim.vy = 0;
  victim.hitstun = 12;
  victim.setState('hitstun');
}

function emitHit(
  w: World,
  victim: Fighter,
  ctx: HitContext,
  damage: number,
  effect: Effect,
  kb: number,
  fatal: boolean,
  angle: number,
): void {
  w.emit({
    type: 'hit',
    x: ctx.x,
    y: ctx.y,
    damage,
    kb,
    effect,
    attacker: ctx.by,
    victim: victim.slot,
    fatal,
    angle,
  });
}

export function dealHit(w: World, victim: Fighter, spec: HitSpec, ctx: HitContext): void {
  if (victim.item?.def.heavy) dropItem(victim);
  const dmg = spec.dmg;
  victim.percent = Math.min(999, victim.percent + dmg);
  victim.record.damageTaken += dmg;
  const author = ctx.by >= 0 ? w.fighters[ctx.by] : undefined;
  if (author && author !== victim) author.record.damageDealt += dmg;
  if (ctx.by >= 0 && ctx.by !== victim.slot) {
    victim.lastHitBy = ctx.by;
    victim.lastHitFrame = w.frame;
  }
  let kb = knockback({ percent: victim.percent, damage: dmg, weight: victim.stats.weight, ...spec });
  if (victim.state === 'crouch') kb *= 0.67;
  const lag = hitlagFrames(dmg, spec.effect === 'electric' ? 1.5 : 1);
  const effect = spec.effect ?? 'normal';
  if (spec.angle === 365) {
    drag(victim, ctx);
    victim.hitlag = Math.min(lag, 5);
    if (ctx.attacker) ctx.attacker.hitlag = Math.min(lag, 4);
    emitHit(w, victim, ctx, dmg, effect, 10, false, 90);
    return;
  }
  if (victim.moveWindow('armor') && kb < 130) {
    victim.hitlag = Math.ceil(lag / 2);
    emitHit(w, victim, ctx, dmg, effect, 0, false, 0);
    return;
  }
  const angle = mirror(resolveAngle(spec.angle, kb, victim.grounded), ctx.dir);
  const tumble = kb >= PHYSICS.tumbleThreshold;
  victim.setState(tumble ? 'tumble' : 'hitstun');
  victim.hitstun = hitstunFrames(kb);
  if (effect === 'ice' && kb > 40) {
    victim.frozen = 30;
    victim.hitstun += 18;
  }
  victim.hitlag = lag;
  victim.pendingLaunch = { kb, angle };
  victim.fastFalling = false;
  if (ctx.attacker) ctx.attacker.hitlag = lag;
  const fatal = predictKO(
    { x: victim.x, y: victim.cy, gravity: victim.stats.gravity, fall: victim.stats.fall },
    kb,
    angle,
    w.stage.def.blast,
  );
  w.emit({
    type: 'hit',
    x: ctx.x,
    y: ctx.y,
    damage: dmg,
    kb,
    effect,
    attacker: ctx.by,
    victim: victim.slot,
    fatal,
    angle,
  });
}

/** Frappe sur un bouclier : il s'use, recule, et peut casser. */
export function shieldHit(w: World, victim: Fighter, dmg: number, ctx: HitContext): void {
  victim.shield -= dmg * 1.1;
  if (victim.shield <= 0) {
    breakShield(victim, w);
    return;
  }
  victim.setState('shieldstun', Math.floor(dmg * 0.6 + 3));
  victim.vx = ctx.dir * Math.min(8, 1.5 + dmg * 0.3);
  const lag = Math.ceil(hitlagFrames(dmg) * 0.7);
  victim.hitlag = lag;
  if (ctx.attacker) {
    ctx.attacker.hitlag = lag;
    if (ctx.attacker.grounded) ctx.attacker.vx = -ctx.dir * Math.min(5, dmg * 0.2);
  }
  w.emit({ type: 'shield', x: ctx.x, y: ctx.y, victim: victim.slot, damage: dmg });
}

/** Le contre : le défenseur esquive et riposte, plus fort que le coup reçu. */
export function counterHit(w: World, defender: Fighter, attacker: Fighter, dmg: number): void {
  defender.facing = attacker.x < defender.x ? -1 : 1;
  startMove(defender, w, 'counterhit');
  defender.intangible = 16;
  w.emit({ type: 'counter', who: defender.slot, x: defender.x, y: defender.cy });
  const spec: HitSpec = { dmg: Math.max(8, Math.round(dmg * 1.3)), angle: 361, bkb: 55, kbg: 85 };
  dealHit(w, attacker, spec, {
    by: defender.slot,
    attacker: defender,
    x: (attacker.x + defender.x) / 2,
    y: attacker.cy,
    dir: defender.facing,
  });
}
