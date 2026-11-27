/* Le HUD : en bas, une carte par joueur (portrait, gros pourcents qui changent de couleur
   et tremblent sous les coups, vies) ; en haut, le chrono ; sur les bords, les bulles des combattants
   hors champ. */
import type { Match } from '../sim/match/match';
import type { Camera } from './camera';
import { percentColor } from './colors';
import type { FighterView } from './fighters-draw';
import { drawPose } from './sprite';

const FONT = '"Bungee", "Arial Black", sans-serif';

function portraitOf(v: FighterView): HTMLImageElement | null {
  return v.assets.sprites.get('portrait')?.img ?? v.assets.sprites.get('idle')?.img ?? null;
}

function drawPortrait(ctx: CanvasRenderingContext2D, v: FighterView, x: number, y: number, r: number): void {
  const img = portraitOf(v);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1030';
  ctx.fill();
  ctx.clip();
  if (img) {
    const k = (r * 2.3) / Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      x - (img.naturalWidth * k) / 2,
      y - r * 1.05,
      img.naturalWidth * k,
      img.naturalHeight * k,
    );
  }
  ctx.restore();
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = v.color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStocks(
  ctx: CanvasRenderingContext2D,
  v: FighterView,
  x: number,
  y: number,
  s: number,
  timed: boolean,
): void {
  ctx.font = `${14 * s}px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  if (timed) {
    const sc = v.f.score;
    ctx.fillText(`${sc > 0 ? '+' : ''}${sc}`, x, y + 5 * s);
    return;
  }
  const n = v.f.stocks;
  if (n > 5) {
    drawPortrait(ctx, v, x + 7 * s, y, 7 * s);
    ctx.fillText(`x${n}`, x + 17 * s, y + 5 * s);
    return;
  }
  for (let i = 0; i < n; i++) drawPortrait(ctx, v, x + 7 * s + i * 17 * s, y, 7 * s);
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  v: FighterView,
  cx: number,
  y: number,
  s: number,
  timed: boolean,
): void {
  const f = v.f;
  const w = 210 * s;
  const h = 70 * s;
  const x = cx - w / 2;
  ctx.save();
  if (f.eliminated) ctx.globalAlpha = 0.45;
  ctx.fillStyle = 'rgba(8,6,20,0.72)';
  ctx.beginPath();
  ctx.moveTo(x + 14 * s, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 14 * s, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = v.color;
  ctx.fillRect(x + 14 * s, y, w - 14 * s, 4 * s);
  drawPortrait(ctx, v, x + 30 * s, y + h / 2, 27 * s);
  drawStocks(ctx, v, x + 66 * s, y + 13 * s, s, timed);
  // les pourcents : tremblent et grossissent quand on prend un coup
  const p = Math.floor(f.percent);
  const dec = Math.floor((f.percent - p) * 10);
  const shake = v.anim.hudShake;
  const pop = 1 + v.anim.hudPop * 0.35;
  ctx.translate(
    x + 150 * s + (Math.random() - 0.5) * shake * s,
    y + 52 * s + (Math.random() - 0.5) * shake * s,
  );
  ctx.scale(pop, pop);
  ctx.transform(1, 0, -0.18, 1, 0, 0);
  ctx.font = `${40 * s}px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.lineWidth = 6 * s;
  ctx.strokeStyle = '#000';
  ctx.strokeText(f.eliminated ? 'K.O.' : String(p), 0, 0);
  ctx.fillStyle = f.eliminated ? '#888' : percentColor(f.percent);
  ctx.fillText(f.eliminated ? 'K.O.' : String(p), 0, 0);
  if (!f.eliminated) {
    ctx.font = `${17 * s}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.strokeText(`.${dec}%`, 2 * s, 0);
    ctx.fillText(`.${dec}%`, 2 * s, 0);
  }
  ctx.restore();
  ctx.font = `${11 * s}px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(`${v.assets.info.name}`, x + 66 * s, y + h - 9 * s);
  ctx.fillStyle = v.color;
  ctx.textAlign = 'right';
  ctx.fillText(v.tag, x + w - 8 * s, y + 17 * s);
}

function drawTimer(ctx: CanvasRenderingContext2D, m: Match, W: number, s: number): void {
  const secs = Math.max(0, Math.ceil(m.timeLeft / 60));
  const txt = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  ctx.font = `${30 * s}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 6 * s;
  ctx.strokeStyle = '#000';
  ctx.strokeText(txt, W / 2, 44 * s);
  ctx.fillStyle = secs <= 10 && m.frame % 30 < 15 ? '#ff4a3a' : '#fff';
  ctx.fillText(txt, W / 2, 44 * s);
}

/** Bulle au bord de l'écran pour un combattant hors champ (avec une miniature). */
function drawBubble(
  ctx: CanvasRenderingContext2D,
  v: FighterView,
  cam: Camera,
  W: number,
  H: number,
  s: number,
): void {
  const f = v.f;
  const p = cam.toScreen(f.x, f.cy, W, H);
  const m = 46 * s;
  if (p.x > -10 && p.x < W + 10 && p.y > -10 && p.y < H + 10) return;
  const x = Math.max(m, Math.min(W - m, p.x));
  const y = Math.max(m, Math.min(H - m - 70 * s, p.y));
  const r = 34 * s;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeStyle = v.color;
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.clip();
  drawPose(ctx, v.assets, f.state === 'tumble' ? 'fall' : 'jump', x, y + r * 0.75, f.facing, r * 1.6);
  ctx.restore();
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  m: Match,
  views: FighterView[],
  cam: Camera,
  W: number,
  H: number,
): void {
  const s = Math.min(W / 1280, H / 720) * 1.15;
  const timed = m.config.mode === 'time' && !m.suddenDeath;
  for (const v of views) if (v.f.alive && v.f.state !== 'respawn') drawBubble(ctx, v, cam, W, H, s);
  const gap = Math.min(240 * s, (W - 20) / views.length);
  const x0 = W / 2 - (gap * (views.length - 1)) / 2;
  views.forEach((v, i) => drawCard(ctx, v, x0 + i * gap, H - 82 * s, Math.min(s, gap / 225), timed));
  if (timed) drawTimer(ctx, m, W, s);
}
