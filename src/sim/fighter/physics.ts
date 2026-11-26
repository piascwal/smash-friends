/* Déplacement d'un combattant et collisions avec le stage : atterrissage, bords, murs et plafonds. */
import { PHYSICS } from '../core/config';
import type { Platform } from '../stage/platforms';
import type { World } from '../world';
import type { Fighter, StateId } from './fighter';

/** États qui s'arrêtent au bord au lieu de tomber (on ne glisse pas dans le vide en attaquant). */
const STAYS_ON_EDGE = new Set<StateId>([
  'idle',
  'crouch',
  'move',
  'shield',
  'shieldstun',
  'shieldrelease',
  'roll',
  'spotdodge',
  'landing',
  'jumpsquat',
  'knockdown',
  'getup',
  'tech',
  'grabbing',
  'grabbed',
  'respawn',
  'dizzy',
  'win',
]);

export interface PhysicsResult {
  landed: Platform | null;
  /** Le combattant vient de quitter le sol (bord franchi). */
  leftGround: boolean;
  /** Mur touché (vitesse horizontale avant le choc). */
  wall: number;
}

function decayLaunch(f: Fighter, factor = 1): void {
  const m = Math.hypot(f.kbx, f.kby);
  if (m <= 0) return;
  const nm = Math.max(0, m - PHYSICS.launchDecay * factor);
  f.kbx *= nm / m;
  f.kby *= nm / m;
}

function groundStep(f: Fighter, res: PhysicsResult): void {
  const p = f.platform!;
  f.x += p.dx + f.vx + f.kbx;
  f.y = p.y;
  f.kby = 0;
  decayLaunch(f, 2);
  if (p.covers(f.x)) return;
  const stayInMove = f.state === 'move' && f.move?.def.kind !== 'air';
  if (STAYS_ON_EDGE.has(f.state) && (f.state !== 'move' || stayInMove) && Math.abs(f.kbx) < 1) {
    f.x = Math.max(p.x, Math.min(p.x + p.w, f.x));
    return;
  }
  f.grounded = false;
  f.platform = null;
  res.leftGround = true;
}

function gravityFactor(f: Fighter): number {
  if (f.state === 'ledge' || (f.state === 'airdodge' && f.t < 18)) return 0;
  const m = f.move;
  if (!m?.def.motion) return 1;
  let g = 1;
  for (const s of m.def.motion) if (s.frame <= m.frame && s.gravity !== undefined) g = s.gravity;
  return g;
}

function airStep(f: Fighter, w: World, res: PhysicsResult): void {
  const st = f.stats;
  const g = gravityFactor(f);
  f.vy += st.gravity * g;
  const maxFall = f.fastFalling ? st.fastFall : st.fall;
  if (g > 0 && f.vy > maxFall) f.vy = maxFall;
  const y0 = f.y;
  f.x += f.vx + f.kbx;
  f.y += f.vy + f.kby;
  decayLaunch(f);
  if (f.vy + f.kby >= 0) {
    const p = w.stage.landing(f.x, y0, f.y, f.dropThrough > 0);
    if (p) {
      f.y = p.y;
      res.landed = p;
      return;
    }
  }
  collideSolids(f, w, res, y0);
}

/** Murs et plafonds des plateformes pleines. */
function collideSolids(f: Fighter, w: World, res: PhysicsResult, y0: number): void {
  const half = f.width / 2;
  for (const p of w.stage.platforms) {
    if (!p.solid) continue;
    const top = p.y;
    const bottom = p.y + p.h;
    const head = f.y - f.height;
    // dans l'épaisseur de la plateforme, en venant du côté ou de dessous (pas du dessus)
    if (y0 > top + 4 && f.y > top + 4 && head < bottom && f.x + half > p.x && f.x - half < p.x + p.w) {
      const wasBelow = y0 - f.height >= bottom - 2;
      if (wasBelow && f.vy + f.kby < 0) {
        f.y = bottom + f.height;
        f.vy = 0;
        f.kby = Math.abs(f.kby) * 0.3;
        continue;
      }
      const left = f.x < p.x + p.w / 2;
      res.wall = f.vx + f.kbx;
      f.x = left ? p.x - half : p.x + p.w + half;
      f.vx = 0;
      f.kbx = -f.kbx * 0.5;
    }
  }
}

export function stepPhysics(f: Fighter, w: World): PhysicsResult {
  const res: PhysicsResult = { landed: null, leftGround: false, wall: 0 };
  if (f.dropThrough > 0) f.dropThrough--;
  if (f.grounded && f.platform) groundStep(f, res);
  else airStep(f, w, res);
  return res;
}

/** Pose le combattant sur une plateforme. */
export function land(f: Fighter, p: Platform): void {
  f.grounded = true;
  f.platform = p;
  f.y = p.y;
  f.vy = 0;
  f.kby = 0;
  f.fastFalling = false;
  f.resetAirOptions();
  f.ledgeInvincibleReady = true;
}

export function leaveGround(f: Fighter): void {
  f.grounded = false;
  f.platform = null;
}

/** Freine au sol (frottement réduit sur la glace). */
export function applyFriction(f: Fighter, w: World, mult = 1): void {
  const k = PHYSICS.friction * (w.stage.def.traction ?? 1) * mult;
  if (f.vx > 0) f.vx = Math.max(0, f.vx - k);
  else if (f.vx < 0) f.vx = Math.min(0, f.vx + k);
}
