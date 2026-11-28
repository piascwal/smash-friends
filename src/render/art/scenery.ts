/* Décors sans collision, en pixel art : grand arbre, palmier, pilotis, tour à toit pointu, ruines,
   cheminée, barrière, lampadaire, drapeau, réacteur, lianes. */
import type { SceneryDef, Theme } from '../../sim/stage/types';
import { PX, PixelCanvas, noise, shade } from './pixels';

type Painter = (c: PixelCanvas, t: Theme) => void;

const LEAVES = ['#2e7a26', '#3a8a2e', '#4fa83a', '#6cc04a'];

const tree: Painter = (c) => {
  const tw = Math.max(4, Math.floor(c.cols * 0.16));
  const tx = Math.floor((c.cols - tw) / 2);
  for (let y = Math.floor(c.rows * 0.4); y < c.rows; y++)
    for (let x = 0; x < tw + (y > c.rows - 4 ? 4 : 0); x++)
      c.px(
        tx + x - (y > c.rows - 4 ? 2 : 0),
        y,
        x % 4 === 1 ? '#5a3a1e' : shade('#7a4e2a', 0.9 + noise(x, y) * 0.2),
      );
  for (let i = 0; i < 14; i++) {
    const cx = c.cols * (0.15 + noise(i, 1) * 0.7);
    const cy = c.rows * (0.08 + noise(i, 2) * 0.35);
    c.disc(cx, cy, Math.floor(c.cols * (0.12 + noise(i, 3) * 0.08)), LEAVES[i % 4]!);
  }
  for (let i = 0; i < 6; i++)
    c.disc(c.cols * (0.2 + noise(i, 5) * 0.6), c.rows * (0.05 + noise(i, 6) * 0.2), 2, '#8ad85a');
};

const palm: Painter = (c) => {
  let x = c.cols * 0.3;
  for (let y = c.rows - 1; y > c.rows * 0.2; y--) {
    x += 0.18;
    c.rect(x, y, 3, 1, y % 3 === 0 ? '#7a5a2e' : '#a07a3e');
  }
  const top = { x: x + 1, y: Math.floor(c.rows * 0.2) };
  for (let a = 0; a < 7; a++) {
    const ang = Math.PI * (0.95 + a * 0.18);
    for (let r = 0; r < c.cols * 0.45; r++)
      c.px(top.x + Math.cos(ang) * r, top.y + Math.sin(ang) * r * 0.5 + (r * r) / 60, LEAVES[a % 4]!);
  }
  c.disc(top.x, top.y + 2, 1, '#5a3a1e');
};

const posts: Painter = (c, t) => {
  for (let x = 1; x < c.cols - 2; x += 15) {
    for (let y = 0; y < c.rows; y++)
      c.rect(x, y, 3, 1, y % 8 === 0 ? shade(t.shade, 1.3) : shade(t.side, 0.8));
  }
  for (let x = 1; x < c.cols - 16; x += 15)
    for (let k = 0; k < 15; k++) c.px(x + k, 6 + Math.floor(k * 0.6), shade(t.side, 0.6));
};

const tower: Painter = (c, t) => {
  const roof = Math.floor(c.rows * 0.32);
  for (let y = roof; y < c.rows; y++)
    for (let x = 0; x < c.cols; x++) {
      const light = 1.15 - Math.abs(x / c.cols - 0.35) * 0.9;
      const joint = y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 3) % 6 === 0;
      c.px(x, y, shade('#b8b0a0', joint ? light * 0.82 : light));
    }
  for (let y = 0; y < roof; y++) {
    const half = Math.round(((y + 1) / roof) * (c.cols / 2 + 2));
    for (let x = Math.floor(c.cols / 2) - half; x < Math.ceil(c.cols / 2) + half; x++)
      c.px(x, y, shade(t.top, y % 3 === 0 ? 0.75 : 1));
  }
  for (let y = roof + 5; y < c.rows - 6; y += 12) c.rect(Math.floor(c.cols / 2) - 1, y, 3, 5, '#2a2440');
};

const ruins: Painter = (c) => {
  for (const [x0, k] of [
    [0.1, 0.7],
    [0.45, 1],
    [0.78, 0.5],
  ] as const) {
    const x = Math.floor(c.cols * x0);
    const h = Math.floor(c.rows * k);
    for (let y = c.rows - h; y < c.rows; y++)
      for (let dx = 0; dx < 6; dx++) c.px(x + dx, y, dx % 2 ? '#c8c0b0' : '#a8a090');
    for (let dx = 0; dx < 6; dx++) c.px(x + dx, c.rows - h - Math.floor(noise(dx, x) * 3), '#d8d0c0');
  }
};

const chimney: Painter = (c) => {
  for (let y = 0; y < c.rows; y++)
    for (let x = 0; x < c.cols; x++)
      c.px(x, y, y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0 ? '#6a2a1e' : '#a8442e');
  c.rect(-1, 0, c.cols + 2, 2, '#4a4a4a');
};

const fence: Painter = (c) => {
  for (let x = 0; x < c.cols; x += 6) c.rect(x, 0, 2, c.rows, '#e8e0d0');
  c.rect(0, 2, c.cols, 1, '#d8d0c0');
  c.rect(0, c.rows - 3, c.cols, 1, '#d8d0c0');
};

const lamp: Painter = (c) => {
  c.rect(Math.floor(c.cols / 2), 4, 1, c.rows - 4, '#2a2a2a');
  c.rect(Math.floor(c.cols / 2) - 2, 1, 5, 4, '#ffe9a0');
  c.rect(Math.floor(c.cols / 2) - 2, 0, 5, 1, '#2a2a2a');
};

const flag: Painter = (c, t) => {
  c.rect(0, 0, 1, c.rows, '#d8d8d8');
  for (let y = 1; y < Math.min(10, c.rows); y++)
    c.rect(1, y, Math.max(1, 12 - Math.abs(y - 5) * 2), 1, t.glow);
};

const engine: Painter = (c) => {
  for (let y = 0; y < c.rows; y++)
    for (let x = 0; x < c.cols; x++) c.px(x, y, shade('#a8adb8', 1.1 - Math.abs(y / c.rows - 0.35) * 0.8));
  c.rect(0, 1, 2, c.rows - 2, '#1a1a22');
  c.rect(c.cols - 2, 2, 2, c.rows - 4, '#ff9a3a');
};

const vines: Painter = (c) => {
  for (let x = 0; x < c.cols; x += 3) {
    const len = Math.floor(c.rows * (0.3 + noise(x, 1) * 0.7));
    for (let y = 0; y < len; y++) c.px(x + (y % 5 === 0 ? 1 : 0), y, LEAVES[(x + y) % 4]!);
  }
};

const PAINTERS: Record<SceneryDef['kind'], Painter> = {
  tree,
  palm,
  posts,
  tower,
  ruins,
  chimney,
  fence,
  lamp,
  flag,
  engine,
  vines,
};

const cache = new WeakMap<SceneryDef, PixelCanvas>();

export function drawScenery(
  ctx: CanvasRenderingContext2D,
  list: readonly SceneryDef[],
  t: Theme,
  front: boolean,
): void {
  ctx.imageSmoothingEnabled = false;
  for (const s of list) {
    if (!!s.front !== front) continue;
    let art = cache.get(s);
    if (!art) {
      art = new PixelCanvas(Math.ceil(s.w / PX), Math.ceil(s.h / PX), 2, 2, 0);
      PAINTERS[s.kind](art, t);
      cache.set(s, art);
    }
    art.draw(ctx, s.x, s.y);
  }
  ctx.imageSmoothingEnabled = true;
}
