/* Eau et lave animées : le fond (derrière les combattants) et la surface translucide (devant, pour
   qu'on voie plonger ceux qui tombent). */
import type { Liquid } from '../../sim/stage/types';

export interface View {
  left: number;
  right: number;
  bottom: number;
}

const COLORS = {
  water: { deep: '#0a2a5a', body: '#1a6fb0', crest: '#7fdcff', foam: '#ffffff' },
  lava: { deep: '#6a0a04', body: '#d8300a', crest: '#ffd23a', foam: '#fff2a0' },
};

function waveY(x: number, y: number, time: number, k: number): number {
  return y + Math.sin(x * 0.012 + time * 0.05 * k) * 6 + Math.sin(x * 0.031 - time * 0.03) * 3;
}

export function drawLiquidBack(ctx: CanvasRenderingContext2D, l: Liquid, v: View, time: number): void {
  const c = COLORS[l.kind];
  const g = ctx.createLinearGradient(0, l.y, 0, l.y + 500);
  g.addColorStop(0, c.body);
  g.addColorStop(1, c.deep);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(v.left, v.bottom + 400);
  for (let x = v.left; x <= v.right + 24; x += 24) ctx.lineTo(x, waveY(x, l.y + 10, time, 1));
  ctx.lineTo(v.right + 24, v.bottom + 400);
  ctx.fill();
  if (l.kind === 'lava') {
    // bulles qui éclatent à la surface
    for (let i = 0; i < 8; i++) {
      const x = v.left + ((i * 397 + time * 0.6) % (v.right - v.left));
      const r = 4 + ((time + i * 13) % 30) / 4;
      ctx.fillStyle = c.crest;
      ctx.globalAlpha = 1 - ((time + i * 13) % 30) / 30;
      ctx.beginPath();
      ctx.arc(x, l.y + 14, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export function drawLiquidFront(ctx: CanvasRenderingContext2D, l: Liquid, v: View, time: number): void {
  const c = COLORS[l.kind];
  ctx.save();
  ctx.globalAlpha = l.kind === 'water' ? 0.55 : 0.85;
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(v.left, l.y + 60);
  for (let x = v.left; x <= v.right + 20; x += 20) ctx.lineTo(x, waveY(x, l.y, time, 1.3));
  ctx.lineTo(v.right + 20, l.y + 60);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.crest;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = v.left; x <= v.right + 20; x += 20) ctx.lineTo(x, waveY(x, l.y, time, 1.3));
  ctx.stroke();
  ctx.fillStyle = c.foam;
  for (let x = Math.floor(v.left / 90) * 90; x < v.right; x += 90) {
    const fx = x + ((time * 0.8) % 90);
    ctx.fillRect(fx, waveY(fx, l.y, time, 1.3) - 3, 16, 4);
  }
  ctx.restore();
}
