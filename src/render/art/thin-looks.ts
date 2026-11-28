/* Plateformes fines : planche sur consoles, branche feuillue, auvent rayé, nuage, poutrelle. */
import { noise, shade } from './pixels';
import type { LookContext } from './ground-looks';

export function plank({ c, t }: LookContext): void {
  for (let x = 0; x < c.cols; x++)
    for (let y = 0; y < c.rows; y++) c.px(x, y, y === 0 ? shade(t.top, 1.15) : shade(t.side, 1 - y * 0.1));
  for (const x0 of [3, c.cols - 5])
    for (let k = 0; k < 4; k++) c.rect(x0 + (x0 < 5 ? k : -k + 1), c.rows + k, 2, 1, shade(t.shade, 1.3));
}

export function branch({ c }: LookContext): void {
  for (let x = 0; x < c.cols; x++) {
    const sag = Math.round(Math.sin((x / c.cols) * Math.PI) * 1);
    for (let y = 0; y < c.rows; y++) c.px(x, y + sag, y === 0 ? '#9a6a3a' : '#6a4422');
  }
  for (let x = 2; x < c.cols; x += 5) {
    const r = 2 + Math.floor(noise(x, 1) * 2);
    c.disc(x, -1 - Math.floor(noise(x, 2) * 2), r, noise(x, 3) > 0.5 ? '#4fa83a' : '#3a8a2e');
    if (noise(x, 4) > 0.5) c.disc(x + 2, c.rows + 1, r - 1, '#2e7a26');
  }
}

export function awning({ c, t }: LookContext): void {
  for (let x = 0; x < c.cols; x++) {
    const stripe = Math.floor(x / 4) % 2 ? t.top : '#f4f0e8';
    for (let y = 0; y < c.rows + 2; y++) c.px(x, y, shade(stripe, 1 - y * 0.06));
    if (x % 4 === 1 || x % 4 === 2) c.px(x, c.rows + 2, shade(stripe, 0.85));
  }
}

export function cloud({ c }: LookContext): void {
  for (let x = 2; x < c.cols - 1; x += 4) {
    const r = 2 + Math.floor(noise(x, 8) * 2);
    c.disc(x, c.rows - 1, r, '#c8d8ee');
    c.disc(x, c.rows - 2, r, '#ffffff');
  }
  for (let x = 0; x < c.cols; x++) c.px(x, 0, '#ffffff');
}

export function girder({ c, t }: LookContext): void {
  for (let x = 0; x < c.cols; x++)
    for (let y = 0; y < c.rows; y++) {
      const hole = y === 1 && x % 6 === 3;
      c.px(x, y, hole ? shade(t.shade, 1) : y === 0 ? t.glow : shade(t.side, 1.1 - y * 0.1));
    }
}
