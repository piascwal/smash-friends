/* Plateformes « naturelles » : masse de terre herbeuse avec racines, rocher, basalte veiné de lave,
   sable, glace avec stalactites. Le dessous s'effile en pointe (île flottante) si la forme l'est. */
import type { Theme } from '../../sim/stage/types';
import { noise, shade, type PixelCanvas } from './pixels';

export interface LookContext {
  c: PixelCanvas;
  t: Theme;
  /** Île flottante (dessous en pointe) plutôt que bloc droit. */
  island: boolean;
}

/** Largeur rognée de chaque côté à la ligne y (dessous en pointe des îles). */
export function inset({ c, island }: LookContext, y: number): number {
  if (!island) return 0;
  const start = c.rows * 0.35;
  if (y < start) return 0;
  const k = (y - start) / (c.rows - start);
  return Math.floor(k ** 1.3 * c.cols * 0.46 + noise(y, 3) * 2);
}

/** Le corps : couleur par ligne, contour sombre, dessous en pointe. */
function body(ctx: LookContext, color: (x: number, y: number) => string, top = 0): void {
  const { c, t } = ctx;
  for (let y = top; y < c.rows; y++) {
    const i = inset(ctx, y);
    for (let x = i; x < c.cols - i; x++) {
      const edge = x === i || x === c.cols - i - 1 || y === c.rows - 1;
      c.px(x, y, edge ? shade(t.shade, 1) : color(x, y));
    }
  }
}

function hangingRoots(ctx: LookContext, color: string): void {
  const { c } = ctx;
  for (let x = 2; x < c.cols - 2; x += 3) {
    if (noise(x, 7) < 0.55) continue;
    // bas de la colonne : dernière ligne où la colonne est encore dans le corps
    let y = c.rows - 1;
    while (y > 0 && !(x >= inset(ctx, y) && x < c.cols - inset(ctx, y))) y--;
    const len = 2 + Math.floor(noise(x, 9) * 6);
    for (let k = 0; k < len; k++) c.px(x + (k % 3 === 2 ? 1 : 0), y + k, color);
  }
}

export function earth(ctx: LookContext): void {
  const { c, t } = ctx;
  body(ctx, (x, y) => {
    const n = noise(x, y);
    if (n > 0.95) return '#8a8f99';
    if (n > 0.9) return shade(t.side, 0.6);
    return shade(t.side, (Math.floor(y / 3) % 2 ? 0.92 : 1) * (1 - (y / c.rows) * 0.35) * (0.94 + n * 0.12));
  });
  for (let x = 0; x < c.cols; x++) {
    c.px(x, 0, shade(t.top, 1.2));
    c.px(x, 1, shade(t.top, 1));
    c.px(x, 2, shade(t.top, 0.8));
    if (noise(x, 4) > 0.55) c.px(x, 3, shade(t.top, 0.7));
    const n = noise(x, 5);
    if (n > 0.6) c.px(x, -1, shade(t.top, 1.25));
    if (n > 0.88) c.px(x, -2, shade(t.top, 1.3));
    if (n > 0.97) c.px(x, -2, ['#ff6b8a', '#ffe14a', '#ffffff'][Math.floor(noise(x, 6) * 3)]!);
  }
  hangingRoots(ctx, shade(t.side, 0.55));
}

export function rock(ctx: LookContext): void {
  const { c, t } = ctx;
  body(ctx, (x, y) => {
    const n = noise(x, y);
    const crack = noise(Math.floor(x / 5), Math.floor(y / 4)) > 0.8 && (x + y) % 5 === 0;
    if (crack) return shade(t.shade, 1.3);
    return shade(t.side, (1 - (y / c.rows) * 0.4) * (0.88 + n * 0.2));
  });
  for (let x = 0; x < c.cols; x++) {
    c.px(x, 0, shade(t.top, 1.15));
    c.px(x, 1, shade(t.top, 0.95));
    if (noise(x, 11) > 0.7) c.px(x, -1, shade('#6fae3a', 1));
  }
}

export function basalt(ctx: LookContext): void {
  const { c, t } = ctx;
  body(ctx, (x, y) => {
    const vein = Math.abs(Math.sin(x * 0.35 + noise(Math.floor(x / 6), 0) * 4) * 6 - (y % 12)) < 0.8;
    if (vein) return noise(x, y) > 0.5 ? '#ff7a1a' : '#ffb03a';
    return shade(t.side, 0.85 + noise(x, y) * 0.2);
  });
  for (let x = 0; x < c.cols; x++) {
    c.px(x, 0, shade(t.top, 1.1));
    c.px(x, 1, shade(t.top, 0.85));
  }
}

export function sand(ctx: LookContext): void {
  const { c, t } = ctx;
  body(ctx, (x, y) => shade(y < 4 ? t.top : t.side, (1 - (y / c.rows) * 0.3) * (0.92 + noise(x, y) * 0.14)));
  for (let x = 0; x < c.cols; x++) {
    c.px(x, 0, shade(t.top, 1.12));
    if (noise(x, 2) > 0.9) c.px(x, 1, '#ffffff');
    if (noise(x, 12) > 0.93) c.px(x, -1, '#e8d8b0');
  }
}

export function ice(ctx: LookContext): void {
  const { c, t } = ctx;
  body(ctx, (x, y) => {
    const glint = (x + y * 2) % 17 === 0 ? '#ffffff' : null;
    return glint ?? shade(t.side, 1 - (y / c.rows) * 0.35);
  });
  for (let x = 0; x < c.cols; x++) {
    c.px(x, 0, '#ffffff');
    c.px(x, 1, shade(t.top, 1));
    if (noise(x, 13) > 0.8) {
      const y0 = c.rows - inset(ctx, c.rows - 1);
      const len = 2 + Math.floor(noise(x, 14) * 5);
      for (let k = 0; k < len; k++) c.px(x, Math.min(c.rows, y0) + k, shade(t.top, 1.1 - k * 0.08));
    }
  }
}
