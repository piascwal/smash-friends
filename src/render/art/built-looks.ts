/* Plateformes construites : maison (toit de tuiles débordant, mur à fenêtres, porte), château (pierres
   appareillées, créneaux aux angles, meurtrières), bois, métal, carlingue d'avion, néon. */
import { noise, shade } from './pixels';
import { inset, type LookContext } from './ground-looks';

export function house({ c, t }: LookContext): void {
  const roof = Math.max(5, Math.min(14, Math.floor(c.rows * 0.32)));
  // toit : tuiles en rangées, il déborde du mur (avant-toit)
  for (let y = 0; y < roof; y++) {
    const over = Math.round((y / roof) * 4);
    for (let x = -over; x < c.cols + over; x++) {
      const seam = y % 3 === 2 || (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0;
      c.px(x, y, shade(t.top, seam ? 0.72 : 1 - y * 0.015));
    }
  }
  for (let x = -4; x < c.cols + 4; x++) c.px(x, roof, shade(t.shade, 1));
  // mur, fenêtres, porte
  for (let y = roof + 1; y < c.rows; y++)
    for (let x = 0; x < c.cols; x++) c.px(x, y, shade(t.side, 0.95 + noise(x, y) * 0.08));
  for (let wy = roof + 4; wy < c.rows - 10; wy += 11)
    for (let wx = 5; wx < c.cols - 8; wx += 12) {
      c.rect(wx - 1, wy - 1, 7, 7, shade(t.shade, 1.4));
      c.rect(wx, wy, 5, 5, noise(wx, wy) > 0.4 ? '#ffe9a0' : '#3a5a8a');
      c.rect(wx + 2, wy, 1, 5, shade(t.shade, 1.4));
    }
  const door = Math.floor(c.cols / 2) - 3;
  c.rect(door, c.rows - 11, 7, 11, shade(t.shade, 1.6));
  c.px(door + 5, c.rows - 6, '#ffd23f');
}

export function castle({ c, t }: LookContext): void {
  for (let y = 0; y < c.rows; y++) {
    const offset = Math.floor(y / 3) % 2 ? 3 : 0;
    for (let x = 0; x < c.cols; x++) {
      const joint = y % 3 === 0 || (x + offset) % 6 === 0;
      c.px(x, y, joint ? shade(t.side, 0.7) : shade(t.side, 0.9 + noise(x, y) * 0.18));
    }
  }
  for (let x = 0; x < c.cols; x++) c.px(x, 0, shade(t.top, 1.1));
  // créneaux aux deux angles, meurtrières
  for (const x0 of [0, c.cols - 4]) {
    c.rect(x0, -3, 4, 3, shade(t.side, 1));
    c.rect(x0, -3, 4, 1, shade(t.top, 1.1));
  }
  for (let x = 6; x < c.cols - 6; x += 10) c.rect(x, 5, 2, Math.min(6, c.rows - 7), shade(t.shade, 1));
}

export function wood({ c, t }: LookContext): void {
  for (let y = 0; y < c.rows; y++)
    for (let x = 0; x < c.cols; x++) {
      const seam = y % 4 === 3 || (x + (Math.floor(y / 4) % 2) * 9) % 18 === 0;
      c.px(x, y, seam ? shade(t.shade, 1.2) : shade(t.side, 0.9 + noise(x, y) * 0.16 - (y / c.rows) * 0.2));
    }
  for (let x = 0; x < c.cols; x++) c.px(x, 0, shade(t.top, 1.1));
  for (let x = 3; x < c.cols; x += 9) c.px(x, 1, '#2a1a0e');
}

export function metal(ctx: LookContext): void {
  const { c, t } = ctx;
  for (let y = 0; y < c.rows; y++) {
    const i = inset(ctx, y);
    for (let x = i; x < c.cols - i; x++) {
      const panel = x % 16 === 0 || y % 10 === 0;
      const rivet = x % 16 === 2 && y % 10 === 2;
      c.px(x, y, rivet ? '#e8e8e8' : panel ? shade(t.shade, 1.5) : shade(t.side, 1 - (y / c.rows) * 0.3));
    }
  }
  for (let x = 0; x < c.cols; x++) {
    c.px(x, 0, shade(t.top, 1.1));
    c.px(x, 1, Math.floor(x / 3) % 2 ? '#ffc21a' : '#222');
  }
}

export function neon({ c, t }: LookContext): void {
  c.rect(0, 0, c.cols, c.rows, shade(t.side, 0.6));
  for (let x = 0; x < c.cols; x++) {
    c.px(x, 0, t.glow);
    c.px(x, 1, shade(t.top, 1));
    if (x % 8 === 4) c.rect(x, 4, 2, 2, x % 16 === 4 ? t.glow : t.top);
  }
  c.rect(0, c.rows - 1, c.cols, 1, t.glow);
}

/** Carlingue d'avion-cargo : nez arrondi à gauche, hublots, bande, dérive à droite. */
export function hull({ c, t }: LookContext): void {
  for (let y = 0; y < c.rows; y++) {
    const round = Math.round(Math.sqrt(Math.max(0, 1 - ((y - c.rows / 2) / (c.rows / 2)) ** 2)) * 14);
    for (let x = -round; x < c.cols + Math.floor(round / 2); x++) {
      const stripe = y === Math.floor(c.rows * 0.55) || y === Math.floor(c.rows * 0.55) + 1;
      c.px(x, y, stripe ? t.glow : shade(t.side, 1.08 - (y / c.rows) * 0.45));
    }
  }
  for (let x = 0; x < c.cols; x++) c.px(x, 0, shade(t.top, 1.15));
  for (let x = 6; x < c.cols - 6; x += 7) c.rect(x, Math.floor(c.rows * 0.28), 3, 3, '#2a4a7a');
  c.rect(-12, Math.floor(c.rows * 0.2), 6, 4, '#2a4a7a');
}
