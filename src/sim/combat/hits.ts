/* Détection des frappes à chaque image : zones de coups des combattants contre zones sensibles,
   chopes, boucliers, contres ; puis projectiles (avec renvoi). */
import { circleRect, type Circle } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import { seize } from '../fighter/grab';
import type { HitboxDef } from '../moves/types';
import type { Projectile } from '../projectiles/projectile';
import { projectileHitPoint } from '../projectiles/update';
import type { World } from '../world';
import { counterHit, dealHit, shieldHit, type HitSpec } from './apply';

export interface ActiveHitbox extends Circle {
  def: HitboxDef;
  dmg: number;
  index: number;
}

/** Zones de coups actives d'un combattant, en coordonnées du monde (charge et taille comprises). */
export function activeHitboxes(f: Fighter): ActiveHitbox[] {
  const m = f.move;
  if (!m || m.charging) return [];
  const ch = m.def.charge;
  const boost = ch ? 1 + ch.bonus * (m.charge / ch.max) : 1;
  const star = f.starPower > 0 ? 1.2 : 1;
  const out: ActiveHitbox[] = [];
  m.def.hitboxes.forEach((h, index) => {
    if (m.frame < h.start || m.frame > h.end) return;
    if (m.def.kind === 'throw') return;
    out.push({
      x: f.x + h.x * f.facing * f.size,
      y: f.y + h.y * f.size,
      r: h.r * f.size,
      def: h,
      dmg: Math.round(h.dmg * boost * star * 10) / 10,
      index,
    });
  });
  return out;
}

export const enemies = (w: World, a: { team: number; slot: number }, b: Fighter): boolean =>
  b.slot !== a.slot && (w.friendlyFire || b.team !== a.team);

const shielding = (f: Fighter) => f.state === 'shield' || f.state === 'shieldstun';

/** Déjà touché par ce coup (et pas encore temps de retoucher pour un coup multiple) ? */
function alreadyHit(a: Fighter, v: Fighter, h: HitboxDef): boolean {
  const last = a.move!.hits.get(v.slot);
  if (last === undefined) return false;
  return !h.rehit || a.move!.frame - last < h.rehit;
}

function grabbable(v: Fighter): boolean {
  return v.vulnerable && !['grabbed', 'ledge', 'dizzy'].includes(v.state) && (v.grounded || v.y > -40);
}

function resolveOne(w: World, a: Fighter, v: Fighter, hb: ActiveHitbox): boolean {
  const h = hb.def;
  if (h.grab) {
    if (!grabbable(v) || a.state !== 'move' || a.partner) return false;
    seize(a, v, w);
    return true;
  }
  const dir = h.behind ? -a.facing : a.facing;
  const ctx = { by: a.slot, attacker: a, x: (hb.x + v.x) / 2, y: hb.y, dir };
  a.move!.hits.set(v.slot, a.move!.frame);
  if (shielding(v)) shieldHit(w, v, hb.dmg, ctx);
  else if (v.moveWindow('counter')) counterHit(w, v, a, hb.dmg);
  else dealHit(w, v, { ...h, dmg: hb.dmg }, ctx);
  return true;
}

export function resolveFighterHits(w: World): void {
  for (const a of w.fighters) {
    const boxes = activeHitboxes(a);
    if (!boxes.length) continue;
    for (const v of w.fighters) {
      if (!enemies(w, a, v)) continue;
      if (!v.vulnerable && !shielding(v)) continue;
      const hurt = v.hurtbox();
      for (const hb of boxes) {
        if (!hb.def.grab && alreadyHit(a, v, hb.def)) continue;
        if (!circleRect(hb, hurt)) continue;
        if (resolveOne(w, a, v, hb)) break;
      }
      if (a.state !== 'move') break; // chope réussie, contre subi…
    }
  }
}

function reflect(w: World, p: Projectile, by: Fighter): void {
  p.owner = by.slot;
  p.team = by.team;
  p.vx = -p.vx * 1.3;
  p.facing = -p.facing as 1 | -1;
  p.power *= 1.4;
  p.hits.clear();
  w.emit({ type: 'reflect', x: p.x, y: p.y });
}

function hitByProjectile(w: World, p: Projectile, v: Fighter): void {
  const spec: HitSpec = { ...p.def.hit, dmg: Math.round(p.def.hit.dmg * p.power) };
  const dir = p.vx !== 0 ? Math.sign(p.vx) : v.x < p.x ? -1 : 1;
  const ctx = { by: p.owner, x: p.x, y: p.y, dir };
  p.hits.set(v.slot, w.frame);
  if (shielding(v)) shieldHit(w, v, spec.dmg, ctx);
  else dealHit(w, v, spec, ctx);
  if (!p.def.pierce) p.dead = true;
}

export function resolveProjectileHits(w: World): void {
  for (const p of w.projectiles) {
    if (p.dead || p.age < (p.def.delay ?? 0)) continue;
    const circle = { ...projectileHitPoint(p), r: p.def.radius };
    for (const v of w.fighters) {
      if (!enemies(w, { team: p.team, slot: p.owner }, v)) continue;
      const last = p.hits.get(v.slot);
      if (last !== undefined && (!p.def.hit.rehit || w.frame - last < p.def.hit.rehit)) continue;
      if (v.moveWindow('reflect') && circleRect({ ...circle, r: circle.r + 40 }, v.hurtbox())) {
        reflect(w, p, v);
        break;
      }
      if (!v.vulnerable && !shielding(v)) continue;
      if (!circleRect(circle, v.hurtbox())) continue;
      hitByProjectile(w, p, v);
      if (p.dead) break;
    }
  }
}
