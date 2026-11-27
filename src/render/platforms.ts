/* Les plateformes, dessinées en pixel art (blocs de 4 pixels du monde) selon la matière du stage,
   préparées une fois puis agrandies sans lissage. */
import type { Platform } from '../sim/stage/platforms';
import type { Theme } from '../sim/stage/types';

const PX = 4;

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Bruit déterministe (même dessin à chaque partie). */
const noise = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

function drawSolid(g: CanvasRenderingContext2D, cols: number, rows: number, t: Theme, island: boolean): void {
  const topRows = 3;
  for (let y = 0; y < rows; y++) {
    // le dessous se resserre en pointe rocheuse (île flottante)
    const inset =
      !island || y < rows * 0.45 ? 0 : Math.floor(((y - rows * 0.45) / (rows * 0.55)) ** 1.4 * cols * 0.42);
    for (let x = inset; x < cols - inset; x++) {
      const n = noise(x, y);
      let color: string;
      if (y < topRows) color = shade(t.top, y === 0 ? 1.15 : 1 - y * 0.06 - n * 0.05);
      else if (y === topRows) color = shade(t.side, 0.6);
      else {
        const band = Math.floor(y / 4) % 2 === 0 ? 1 : 0.9;
        color = shade(t.side, band * (0.9 + n * 0.2) * (1 - (y / rows) * 0.45));
        if (n > 0.93) color = shade(t.shade, 1.2);
      }
      if (x === inset || x === cols - inset - 1) color = shade(t.shade, 1);
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
  }
  decorate(g, cols, t);
}

function decorate(g: CanvasRenderingContext2D, cols: number, t: Theme): void {
  for (let x = 2; x < cols - 2; x++) {
    const n = noise(x, 99);
    if (t.material === 'herbe' && n > 0.6) {
      g.fillStyle = shade(t.top, 1.25);
      g.fillRect(x, -1, 1, 1 + Math.floor(n * 2));
    } else if (t.material === 'neon' && x % 6 === 0) {
      g.fillStyle = t.glow;
      g.fillRect(x, 4, 2, 1);
    } else if (t.material === 'glace' && n > 0.85) {
      g.fillStyle = '#ffffff';
      g.fillRect(x, 1, 2, 1);
    } else if (t.material === 'metal' && x % 10 === 3) {
      g.fillStyle = shade(t.top, 0.7);
      g.fillRect(x, 5, 1, 1);
    }
  }
}

function drawThin(g: CanvasRenderingContext2D, cols: number, rows: number, t: Theme): void {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const edge = x === 0 || x === cols - 1;
      g.fillStyle = y === 0 ? shade(t.top, 1.2) : edge ? shade(t.shade, 1) : shade(t.side, 1 - y * 0.12);
      g.fillRect(x, y, 1, 1);
    }
  }
}

const cache = new WeakMap<Platform, HTMLCanvasElement>();

export function platformCanvas(p: Platform, t: Theme): HTMLCanvasElement {
  let c = cache.get(p);
  if (c) return c;
  c = document.createElement('canvas');
  const cols = Math.ceil(p.w / PX);
  const rows = Math.ceil((p.solid ? p.h : p.h) / PX);
  c.width = cols;
  c.height = rows + 2;
  const g = c.getContext('2d')!;
  g.translate(0, 2);
  if (p.solid) drawSolid(g, cols, rows, t, (p.def.shape ?? 'island') === 'island');
  else drawThin(g, cols, rows, t);
  cache.set(p, c);
  return c;
}

export function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: readonly Platform[],
  t: Theme,
  time: number,
): void {
  ctx.imageSmoothingEnabled = false;
  for (const p of platforms) {
    const c = platformCanvas(p, t);
    if (!p.solid) {
      // lueur sous les plateformes fines
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(time * 0.05 + p.index) * 0.1;
      ctx.fillStyle = t.glow;
      ctx.fillRect(p.x + 6, p.y + p.h, p.w - 12, 5);
      ctx.restore();
    }
    ctx.drawImage(c, p.x, p.y - 2 * PX, c.width * PX, c.height * PX);
  }
  ctx.imageSmoothingEnabled = true;
}
