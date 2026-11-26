/* Dessin des combattants dans le monde : traînées, silhouette d'impact, lueur de charge, bouclier,
   plateforme de retour, étoiles d'étourdissement, et pastille du joueur au-dessus de la tête. */
import type { CharacterAssets } from '../assets/loader';
import { SHIELD } from '../sim/core/config';
import type { Fighter } from '../sim/fighter/fighter';
import { lookOf, type Anim, type Look } from './fighter-look';
import { drawPose } from './sprite';

const TRAIL_COLORS: Record<string, string> = {
  vitesse: '#ffffff',
  blanc: '#ffffff',
  air: '#bfe8ff',
  feu: '#ff8a1f',
  ejection: '#ffffff',
};

export interface FighterView {
  f: Fighter;
  assets: CharacterAssets;
  color: string;
  tag: string;
  anim: Anim;
}

function drawShield(ctx: CanvasRenderingContext2D, f: Fighter, color: string, time: number): void {
  const k = 0.35 + 0.65 * (f.shield / SHIELD.max);
  const r = SHIELD.radius * f.size * k;
  ctx.save();
  ctx.globalAlpha = f.shield < 15 && time % 6 < 3 ? 0.25 : 0.45;
  const g = ctx.createRadialGradient(f.x, f.cy, r * 0.2, f.x, f.cy, r);
  g.addColorStop(0, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(f.x, f.cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawRespawnPlatform(ctx: CanvasRenderingContext2D, f: Fighter, color: string, time: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.5 - i * 0.14;
    ctx.fillStyle = i === 0 ? '#ffffff' : color;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y + 4, 52 + i * 10 + Math.sin(time * 0.1) * 3, 9 + i * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDizzy(ctx: CanvasRenderingContext2D, f: Fighter, time: number): void {
  ctx.fillStyle = '#ffe23f';
  for (let i = 0; i < 3; i++) {
    const a = time * 0.12 + (i * Math.PI * 2) / 3;
    const x = f.x + Math.cos(a) * 30;
    const y = f.y - f.height - 14 + Math.sin(a) * 8;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Pastille « J1 » / « CPU » au-dessus de la tête. */
function drawTag(ctx: CanvasRenderingContext2D, v: FighterView, zoom: number): void {
  const f = v.f;
  const s = 1 / Math.max(0.5, zoom);
  const y = f.y - f.height - 20 * s - 6;
  ctx.save();
  ctx.translate(f.x, y);
  ctx.scale(s, s);
  ctx.font = '700 15px "Bungee", sans-serif';
  const w = ctx.measureText(v.tag).width + 12;
  ctx.fillStyle = v.color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -24, w, 20, 5);
  ctx.moveTo(-6, -4);
  ctx.lineTo(0, 4);
  ctx.lineTo(6, -4);
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(v.tag, 0, -8);
  ctx.restore();
}

function overlayFor(f: Fighter, time: number): string | undefined {
  if (f.frozen > 0) return '#9fe8ff';
  if (f.starPower > 0) return `hsl(${(time * 12) % 360},100%,60%)`;
  if (f.state === 'move' && f.move?.charging) return time % 6 < 3 ? '#ffe23f' : '#ffffff';
  if (f.invincible > 0 && time % 8 < 4) return '#ffffff';
  return undefined;
}

function recordTrail(v: FighterView, look: Look, time: number): void {
  const t = v.anim.trail;
  if (look.trail && time % 2 === 0) t.push({ x: v.f.x, y: v.f.y, look: { ...look } });
  if (t.length > 6 || (!look.trail && t.length && time % 2 === 0)) t.shift();
}

export function drawFighter(ctx: CanvasRenderingContext2D, v: FighterView, time: number, zoom: number): void {
  const f = v.f;
  if (!f.alive) return;
  const look = lookOf(f, time, v.anim);
  recordTrail(v, look, time);
  const h = 100 * f.size;
  v.anim.trail.forEach((p, i) => {
    const color = TRAIL_COLORS[p.look.trail ?? 'blanc'] ?? v.color;
    drawPose(ctx, v.assets, p.look.pose, p.x, p.y, p.look.facing, h, {
      tint: p.look.trail === 'ejection' ? v.color : color,
      alpha: ((i + 1) / (v.anim.trail.length + 1)) * 0.45,
      rot: p.look.rot,
      sx: p.look.sx,
      sy: p.look.sy,
    });
  });
  if (f.state === 'respawn') drawRespawnPlatform(ctx, f, v.color, time);
  const shake = f.hitlag > 0 && f.pendingLaunch ? (time % 2 ? 4 : -4) : 0;
  drawPose(ctx, v.assets, look.pose, f.x + shake, f.y + look.dy, look.facing, h, {
    rot: look.rot,
    sx: look.sx,
    sy: look.sy,
    alpha: look.alpha,
    flash: v.anim.hitFlash > 0,
    overlay: overlayFor(f, time),
  });
  if (f.state === 'shield' || f.state === 'shieldstun') drawShield(ctx, f, v.color, time);
  if (f.state === 'dizzy') drawDizzy(ctx, f, time);
  drawTag(ctx, v, zoom);
}
