/* Effets plein écran : explosions d'éjection depuis le bord, éclair, lignes du coup fatal, textes. */
import type { Camera } from './camera';
import type { Effects, KoBlast } from './fx/effects';

/** Le grand faisceau coloré qui jaillit du bord de l'écran à l'éjection. */
function drawBlast(ctx: CanvasRenderingContext2D, b: KoBlast, cam: Camera, W: number, H: number): void {
  const p = cam.toScreen(b.x, b.y, W, H);
  const x = Math.max(0, Math.min(W, p.x));
  const y = Math.max(0, Math.min(H, p.y));
  const t = b.age / 80;
  const grow = Math.min(1, b.age / 8);
  const len = Math.max(W, H) * 0.9 * grow;
  const width = Math.min(W, H) * 0.22 * (1 - t) ** 0.7;
  const angle = Math.atan2(H / 2 - y, W / 2 - x);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, b.color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 1 - t;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -width);
  ctx.lineTo(len, -width * 0.12);
  ctx.lineTo(len, width * 0.12);
  ctx.lineTo(0, width);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -width * 0.35);
  ctx.lineTo(len * 0.7, 0);
  ctx.lineTo(0, width * 0.35);
  ctx.fill();
  // pointes rayonnantes
  for (let i = 0; i < 14; i++) {
    const a = ((i * 137) % 360) * (Math.PI / 180);
    const l = (0.3 + ((i * 53) % 10) / 14) * len * 0.6;
    ctx.fillStyle = i % 2 ? b.color : '#fff';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - 0.05) * l, Math.sin(a - 0.05) * l);
    ctx.lineTo(Math.cos(a + 0.05) * l, Math.sin(a + 0.05) * l);
    ctx.fill();
  }
  ctx.restore();
}

/** Éjection vers le haut : le combattant part en étoile dans le ciel. */
function drawStarKo(ctx: CanvasRenderingContext2D, b: KoBlast, cam: Camera, W: number, H: number): void {
  const p = cam.toScreen(b.x, b.y, W, H);
  const t = b.age / 80;
  const x = p.x + (W / 2 - p.x) * 0.3 * t;
  const y = H * 0.12 + (1 - t) * 20;
  if (t > 0.55) {
    const k = 1 - (t - 0.55) / 0.45;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = k;
    ctx.translate(x, y);
    ctx.rotate(t * 6);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-2, 0, 4, 26 * k);
    }
    ctx.restore();
  }
}

function drawCinematic(ctx: CanvasRenderingContext2D, fx: Effects, W: number, H: number): void {
  if (fx.cinematic <= 0) return;
  const k = Math.min(1, fx.cinematic / 12);
  ctx.save();
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(120,0,0,${0.75 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r0 = Math.min(W, H) * (0.25 + Math.random() * 0.2);
    ctx.strokeStyle = i % 3 ? `rgba(255,255,255,${0.5 * k})` : `rgba(255,60,40,${0.7 * k})`;
    ctx.lineWidth = 2 + Math.random() * 4;
    ctx.beginPath();
    ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0);
    ctx.lineTo(W / 2 + Math.cos(a) * W, H / 2 + Math.sin(a) * W);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTexts(ctx: CanvasRenderingContext2D, fx: Effects, W: number, H: number): void {
  const s = Math.min(W / 1280, H / 720);
  for (const t of fx.texts) {
    const u = t.age / t.max;
    const pop = u < 0.15 ? 2.2 - (u / 0.15) * 1.2 : 1 + (u - 0.15) * 0.15;
    ctx.save();
    ctx.globalAlpha = u > 0.8 ? (1 - u) / 0.2 : 1;
    ctx.translate(W / 2, H * 0.42);
    ctx.scale(pop, pop);
    ctx.transform(1, 0, -0.15, 1, 0, 0);
    ctx.font = `${120 * s}px "Bungee", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 14 * s;
    ctx.strokeStyle = '#120a24';
    ctx.strokeText(t.text, 0, 0);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  fx: Effects,
  cam: Camera,
  W: number,
  H: number,
): void {
  drawCinematic(ctx, fx, W, H);
  for (const b of fx.blasts) (b.star ? drawStarKo : drawBlast)(ctx, b, cam, W, H);
  if (fx.flash > 0.02) {
    ctx.save();
    ctx.globalAlpha = fx.flash;
    ctx.fillStyle = fx.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  drawTexts(ctx, fx, W, H);
}
