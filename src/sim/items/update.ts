/* Vie des objets : chute, vol après un lancer (et retour du frisbee), frappes en vol, explosions,
   caisses brisées, soins et étoile ramassés au contact. */
import { activeHitboxes, enemies } from '../combat/hits';
import { dealHit, shieldHit } from '../combat/apply';
import { circleCircle, circleRect } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import type { World } from '../world';
import { ITEM_LIST } from './catalog';
import { holdPosition } from './carry';
import { Item } from './item';

const GRAVITY = 0.6;

export function explodeItem(w: World, it: Item): void {
  const e = it.def.explosion;
  if (!e || it.dead) return;
  it.dead = true;
  w.explode(it.x, it.y, e.r, e.dmg, e.bkb, e.kbg, it.thrownBy);
}

/** Une caisse se brise et libère de 1 à 3 objets. */
export function breakContainer(w: World, it: Item): void {
  if (it.dead) return;
  it.dead = true;
  w.emit({ type: 'item', what: 'break', x: it.x, y: it.y });
  const n = w.rng.int(1, 3);
  const pool = ITEM_LIST.filter((d) => d.kind !== 'container');
  for (let i = 0; i < n; i++) {
    const def = w.rng.weighted(pool.map((d) => ({ item: d, weight: d.weight })));
    const out = new Item(def, it.x, it.y - 10);
    out.spawning = 0;
    out.vx = w.rng.range(-4, 4);
    out.vy = w.rng.range(-9, -5);
    w.items.push(out);
  }
}

function impact(w: World, it: Item): void {
  if (it.def.kind === 'explosive') return explodeItem(w, it);
  if (it.def.kind === 'container') return breakContainer(w, it);
  it.flying = false;
  it.vx = -it.vx * 0.3;
  it.vy = -4;
}

function flyingHits(w: World, it: Item): void {
  const speed = Math.hypot(it.vx, it.vy);
  if (speed < 4) return;
  const circle = { x: it.x, y: it.y, r: it.def.radius };
  for (const v of w.fighters) {
    if (it.hits.has(v.slot) || !enemies(w, { team: it.thrownTeam, slot: it.thrownBy }, v)) continue;
    const shielding = v.state === 'shield' || v.state === 'shieldstun';
    if (!v.vulnerable && !shielding) continue;
    if (!circleRect(circle, v.hurtbox())) continue;
    it.hits.add(v.slot);
    const ctx = { by: it.thrownBy, x: it.x, y: it.y, dir: it.vx < 0 ? -1 : 1 };
    if (it.def.kind === 'explosive') return explodeItem(w, it);
    const spec = { ...it.def.thrown, dmg: Math.round(it.def.thrown.dmg * Math.min(1.3, speed / 12)) };
    if (shielding) shieldHit(w, v, spec.dmg, ctx);
    else dealHit(w, v, spec, ctx);
    return impact(w, it);
  }
}

/** Coups portés sur les objets posés : les barils explosent, les caisses finissent par céder. */
function struckByAttacks(w: World, it: Item): void {
  if (it.def.kind !== 'explosive' && it.def.kind !== 'container') return;
  const circle = { x: it.x, y: it.y, r: it.def.radius };
  for (const f of w.fighters) {
    for (const hb of activeHitboxes(f)) {
      if (!circleCircle(hb, circle) || f.move!.hits.has(-it.uid)) continue;
      f.move!.hits.set(-it.uid, f.move!.frame);
      it.thrownBy = f.slot;
      it.thrownTeam = f.team;
      if (it.def.kind === 'explosive') return explodeItem(w, it);
      it.damage += hb.dmg;
      it.vx += f.facing * hb.dmg * 0.4;
      it.vy = -3;
      it.grounded = false;
      if (it.damage >= 14) return breakContainer(w, it);
    }
  }
}

function consume(w: World, it: Item, f: Fighter): void {
  it.dead = true;
  if (it.def.kind === 'heal') {
    f.percent = Math.max(0, f.percent - (it.def.heal ?? 0));
    w.emit({ type: 'item', what: 'heal', x: it.x, y: it.y });
  } else {
    f.invincible = Math.max(f.invincible, 480);
    f.starPower = 480;
    w.emit({ type: 'item', what: 'star', x: it.x, y: it.y });
  }
}

function touchConsumables(w: World, it: Item): void {
  if (it.def.kind !== 'heal' && it.def.kind !== 'star') return;
  const circle = { x: it.x, y: it.y, r: it.def.radius + 6 };
  const f = w.fighters.find((f) => f.alive && f.state !== 'respawn' && circleRect(circle, f.hurtbox()));
  if (f) consume(w, it, f);
}

function physics(w: World, it: Item): void {
  const boomerang = it.flying && it.def.boomerang;
  if (boomerang) {
    it.flightTime++;
    if (it.flightTime > 26) it.vx -= Math.sign(it.vx || 1) * 0.9 * (it.thrownBy >= 0 ? 1 : 0);
    if (it.flightTime > 70) it.flying = false;
  } else it.vy += GRAVITY;
  const y0 = it.y + it.def.radius;
  it.x += it.vx;
  it.y += it.vy;
  it.angle += it.flying ? it.vx * 2 : 0;
  if (it.vy < 0) return;
  const p = w.stage.landing(it.x, y0, it.y + it.def.radius, false);
  if (!p) {
    it.grounded = false;
    return;
  }
  if (it.flying && (it.def.kind === 'explosive' || it.def.kind === 'container') && it.vy > 6)
    return impact(w, it);
  it.y = p.y - it.def.radius;
  it.vy = it.vy > 5 ? -it.vy * 0.3 : 0;
  it.vx *= 0.7;
  it.grounded = true;
  it.flying = false;
  it.x += p.dx;
}

export function updateItems(w: World): void {
  for (const it of w.items) {
    it.age++;
    if (it.spawning > 0) {
      it.spawning--;
      continue;
    }
    if (it.holder >= 0) {
      const f = w.fighters[it.holder];
      if (!f || f.item !== it) it.holder = -1;
      else holdPosition(f, it);
      if (it.def.kind === 'shooter' && it.ammo <= 0 && f && f.state !== 'move') f.item = null;
      continue;
    }
    physics(w, it);
    if (it.flying) flyingHits(w, it);
    else {
      struckByAttacks(w, it);
      touchConsumables(w, it);
    }
    const b = w.stage.def.blast;
    if (it.y > b.bottom || it.x < b.left || it.x > b.right || (!it.flying && it.age > it.def.life))
      it.dead = true;
  }
  for (let i = w.items.length - 1; i >= 0; i--) {
    const it = w.items[i]!;
    if (it.dead || (it.def.kind === 'shooter' && it.ammo <= 0 && it.holder < 0)) w.items.splice(i, 1);
  }
}
