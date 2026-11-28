/* Dangers des stages : la lave brûle et projette en l'air ceux qui la touchent, et des boules de lave
   en jaillissent de temps en temps. */
import { dealHit } from '../combat/apply';
import { PROJECTILES } from '../projectiles/catalog';
import { Projectile } from '../projectiles/projectile';
import type { World } from '../world';

/** Intervalle moyen entre deux boules de lave (images). */
const BALL_EVERY = 150;
const BURN = { dmg: 14, angle: 90, bkb: 95, kbg: 30, effect: 'fire' as const };

export function updateHazards(w: World): void {
  const liquid = w.stage.def.liquid;
  if (liquid?.kind !== 'lava') return;
  for (const f of w.fighters) {
    if (!f.alive || f.state === 'respawn' || f.hazardCooldown > 0 || f.y < liquid.y - 4) continue;
    f.hazardCooldown = 40;
    dealHit(w, f, BURN, { by: -1, x: f.x, y: liquid.y, dir: f.x < 0 ? 1 : -1 });
  }
  if (w.rng.chance(1 / BALL_EVERY)) {
    const cam = w.stage.def.camera;
    const x = w.rng.range(cam.left + 150, cam.right - 150);
    const ball = new Projectile(PROJECTILES.boule_lave, -1, -1, x, liquid.y, w.rng.range(-1.5, 1.5), -17, 1);
    w.projectiles.push(ball);
  }
}
