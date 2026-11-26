/* Quelle image montrer pour un combattant, et comment la déformer (étirement, inclinaison, vrille)
   selon son état : c'est ce qui donne vie à des images fixes. */
import type { Fighter } from '../sim/fighter/fighter';

export interface Look {
  pose: string;
  facing: number;
  rot: number;
  sx: number;
  sy: number;
  dy: number;
  alpha: number;
  /** Traînée d'images (couleur), ou rien. */
  trail: string | null;
}

/** État d'animation propre au rendu (un par combattant). */
export interface Anim {
  flipTimer: number;
  hitFlash: number;
  lastPercent: number;
  hudShake: number;
  hudPop: number;
  trail: { x: number; y: number; look: Look }[];
}

export const newAnim = (): Anim => ({
  flipTimer: 0,
  hitFlash: 0,
  lastPercent: 0,
  hudShake: 0,
  hudPop: 0,
  trail: [],
});

const base = (f: Fighter, pose: string): Look => ({
  pose,
  facing: f.facing,
  rot: 0,
  sx: 1,
  sy: 1,
  dy: 0,
  alpha: 1,
  trail: null,
});

function moveLook(f: Fighter, l: Look): Look {
  const m = f.move!;
  const def = m.def;
  const fx = def.fx ?? {};
  const active = def.hitboxes.some((h) => m.frame >= h.start && m.frame <= h.end + 2);
  const windup = m.charging || (def.windupEnd !== undefined && m.frame < def.windupEnd);
  l.pose = windup && def.windup ? def.windup : def.pose;
  if (fx.mirror && !windup) l.facing = -f.facing;
  if (fx.flipAt && m.frame >= fx.flipAt) l.facing = -f.facing;
  if (fx.rot && !windup) l.rot = fx.rot;
  if (fx.spins && !windup) l.rot += (m.frame / def.total) * 360 * fx.spins;
  if (active && fx.stretch) {
    l.sx = fx.stretch;
    l.sy = 2 - fx.stretch * 0.95;
  }
  if (m.charging) {
    const k = Math.sin(m.charge * 0.9) * 0.025;
    l.sx = 0.96 + k;
    l.sy = 1.04 - k;
  }
  if (fx.trail && (active || def.kind === 'special')) l.trail = fx.trail;
  return l;
}

function airLook(f: Fighter, anim: Anim, l: Look): Look {
  l.pose = 'jump';
  if (anim.flipTimer > 0) l.rot = (1 - anim.flipTimer / 16) * 360 * f.facing;
  else l.rot = Math.max(-12, Math.min(12, f.vy * 1.2)) * f.facing;
  if (f.vy < -6) {
    l.sx = 0.94;
    l.sy = 1.06;
  }
  return l;
}

export function lookOf(f: Fighter, time: number, anim: Anim): Look {
  const l = base(f, 'idle');
  switch (f.state) {
    case 'idle':
    case 'respawn':
      l.sy = 1 + Math.sin(time * 0.09 + f.slot) * 0.012;
      return l;
    case 'walk':
      l.pose = Math.floor(time / 9) % 2 ? 'walk1' : 'walk2';
      return l;
    case 'dash':
    case 'run':
      l.pose = Math.floor(time / 5) % 2 ? 'walk1' : 'walk2';
      l.rot = 7;
      l.sx = 1.05;
      l.trail = f.state === 'dash' ? 'vitesse' : null;
      return l;
    case 'crouch':
    case 'getup':
      l.pose = 'crouch';
      return l;
    case 'jumpsquat':
    case 'landing':
      l.pose = 'crouch';
      l.sx = 1.08;
      l.sy = 0.94;
      return l;
    case 'air':
    case 'helpless':
      airLook(f, anim, l);
      if (f.state === 'helpless') l.alpha = 0.85;
      return l;
    case 'move':
      return f.move ? moveLook(f, l) : l;
    default:
      return defensiveLook(f, time, l);
  }
}

function defensiveLook(f: Fighter, time: number, l: Look): Look {
  switch (f.state) {
    case 'shield':
    case 'shieldstun':
    case 'shieldrelease':
      l.pose = 'block';
      return l;
    case 'roll':
    case 'tech':
      l.pose = 'crouch';
      l.alpha = 0.75;
      l.trail = 'blanc';
      return l;
    case 'spotdodge':
      l.pose = 'block';
      l.alpha = time % 4 < 2 ? 0.45 : 0.7;
      return l;
    case 'airdodge':
      l.pose = 'jump';
      l.alpha = 0.55;
      l.trail = 'blanc';
      return l;
    case 'hitstun':
    case 'grabbed':
    case 'dizzy':
      l.pose = 'hit';
      if (f.state === 'dizzy') l.rot = Math.sin(time * 0.15) * 8;
      return l;
    case 'tumble':
      l.pose = 'fall';
      l.rot = f.spin * f.facing;
      l.trail = Math.hypot(f.kbx, f.kby) > 9 ? 'ejection' : null;
      return l;
    case 'knockdown':
      l.pose = 'down';
      return l;
    case 'ledge':
      l.pose = 'jump';
      l.rot = -18;
      l.dy = 6;
      return l;
    case 'grabbing':
      l.pose = 'punch_light';
      return l;
    case 'win':
      l.pose = 'win';
      return l;
  }
  return l;
}
