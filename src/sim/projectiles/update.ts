/* Apparition et vol des projectiles. */
import type { Fighter } from '../fighter/fighter';
import type { World } from '../world';
import { PROJECTILES } from './catalog';
import { Projectile } from './projectile';
import type { ProjectileId } from './types';

/** Hauteur du sol sous x (la plateforme la plus haute sous `fromY`), ou null. */
function groundUnder(w: World, x: number, fromY: number): number | null {
  const p = w.stage.landing(x, fromY, fromY + 2000, false);
  return p ? p.y : null;
}

export function spawnProjectile(w: World, owner: Fighter, id: ProjectileId): void {
  const def = PROJECTILES[id];
  const mine = w.projectiles.filter((p) => !p.dead && p.owner === owner.slot && p.def.id === id);
  if (mine.length >= def.max) return;
  const s = owner.size;
  let x = owner.x + owner.facing * 44 * s;
  let y = owner.y - 56 * s;
  if (def.path === 'column' || def.path === 'pillar') {
    x = owner.x + owner.facing * (def.reach ?? 120);
    y = groundUnder(w, x, owner.y - 200) ?? owner.y;
  } else if (def.path === 'ground') {
    y = owner.grounded ? owner.y - def.radius : y;
  }
  const p = new Projectile(
    def,
    owner.slot,
    owner.team,
    x,
    y,
    owner.facing * def.speed,
    def.vy ?? 0,
    owner.facing,
  );
  if (def.path === 'ground' && owner.grounded) p.groundY = owner.y;
  w.projectiles.push(p);
}

function nearestEnemy(w: World, p: Projectile): Fighter | null {
  let best: Fighter | null = null;
  let bestD = Infinity;
  for (const f of w.fighters) {
    if (f.slot === p.owner || (!w.friendlyFire && f.team === p.team) || !f.vulnerable) continue;
    const d = Math.hypot(f.cx - p.x, f.cy - p.y);
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  return best;
}

function moveGround(w: World, p: Projectile): void {
  p.x += p.vx;
  if (p.groundY === null) {
    p.vy += 0.6;
    const y0 = p.y + p.def.radius;
    p.y += p.vy;
    const land = w.stage.landing(p.x, y0, p.y + p.def.radius, false);
    if (land) {
      p.groundY = land.y;
      p.y = land.y - p.def.radius;
    }
    return;
  }
  // s'arrête au bord de la plateforme
  const under = w.stage.landing(p.x, p.groundY - 4, p.groundY + 4, false);
  if (!under) p.dead = true;
}

function moveBouncing(w: World, p: Projectile, explodeOnLand: boolean): void {
  p.vy += p.def.gravity ?? 0.4;
  const y0 = p.y + p.def.radius;
  p.x += p.vx;
  p.y += p.vy;
  if (p.vy <= 0) return;
  const land = w.stage.landing(p.x, y0, p.y + p.def.radius, false);
  if (!land) return;
  if (explodeOnLand) {
    p.dead = true;
    w.emit({ type: 'explosion', x: p.x, y: land.y - 10, r: 30 });
    return;
  }
  p.y = land.y - p.def.radius;
  p.vy = -Math.max(5, Math.abs(p.vy) * 0.75);
  p.bounces++;
  if (p.bounces > (p.def.bounces ?? 0)) p.dead = true;
}

function moveHoming(w: World, p: Projectile): void {
  const t = nearestEnemy(w, p);
  if (t) {
    const dx = t.cx - p.x;
    const dy = t.cy - p.y;
    const d = Math.hypot(dx, dy) || 1;
    p.vx += ((dx / d) * p.def.speed - p.vx) * 0.04;
    p.vy += ((dy / d) * p.def.speed - p.vy) * 0.04;
    p.facing = p.vx < 0 ? -1 : 1;
  }
  p.x += p.vx;
  p.y += p.vy;
}

export function updateProjectiles(w: World): void {
  for (const p of w.projectiles) {
    p.age++;
    if (p.age > p.def.life) p.dead = true;
    switch (p.def.path) {
      case 'straight':
        p.x += p.vx;
        p.y += p.vy;
        break;
      case 'ground':
        moveGround(w, p);
        break;
      case 'lob':
        moveBouncing(w, p, true);
        break;
      case 'bounce':
        moveBouncing(w, p, false);
        break;
      case 'homing':
        moveHoming(w, p);
        break;
    }
    const b = w.stage.def.blast;
    if (p.x < b.left || p.x > b.right || p.y > b.bottom || p.y < b.top) p.dead = true;
  }
  for (let i = w.projectiles.length - 1; i >= 0; i--) if (w.projectiles[i]!.dead) w.projectiles.splice(i, 1);
}

/** Centre de la zone dangereuse (les colonnes et piliers frappent au-dessus du sol). */
export function projectileHitPoint(p: Projectile): { x: number; y: number } {
  if (p.def.path === 'column' || p.def.path === 'pillar') return { x: p.x, y: p.y - p.def.radius * 1.4 };
  return { x: p.x, y: p.y };
}
