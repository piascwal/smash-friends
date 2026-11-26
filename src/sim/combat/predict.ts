/* Prédit si une éjection va sortir de l'écran : sert à la cinématique du « coup fatal »
   (ralenti, zoom, éclair rouge). Simulation simplifiée sans influence directionnelle. */
import { PHYSICS } from '../core/config';
import { launchVelocity } from './knockback';

export interface Trajectory {
  x: number;
  y: number;
  gravity: number;
  fall: number;
}

export function predictKO(
  t: Trajectory,
  kb: number,
  angle: number,
  blast: { left: number; right: number; top: number; bottom: number },
): boolean {
  const v = launchVelocity(kb, angle, 1);
  let { x, y } = t;
  let kx = v.vx;
  let ky = v.vy;
  let vy = 0;
  for (let i = 0; i < 240; i++) {
    vy = Math.min(t.fall, vy + t.gravity);
    x += kx;
    y += ky + vy;
    const m = Math.hypot(kx, ky);
    if (m > 0) {
      const nm = Math.max(0, m - PHYSICS.launchDecay);
      kx *= nm / m;
      ky *= nm / m;
    }
    // le haut ne compte que si l'élan vers le haut est encore là (sinon on retombe)
    if (x < blast.left || x > blast.right || y > blast.bottom) return true;
    if (y < blast.top && ky + vy < 0) return true;
    if (m === 0 && vy >= t.fall) return false;
  }
  return false;
}
