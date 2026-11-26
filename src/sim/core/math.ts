/* Petits outils de calcul partagés par toute la simulation. */

export const clamp = (v: number, min: number, max: number): number => (v < min ? min : v > max ? max : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Rapproche `v` de `cible` d'au plus `pas` (accélération, freinage). */
export function approach(v: number, cible: number, pas: number): number {
  if (v < cible) return Math.min(v + pas, cible);
  if (v > cible) return Math.max(v - pas, cible);
  return v;
}

export const sign = (v: number): -1 | 1 => (v < 0 ? -1 : 1);

export const deg = (radians: number): number => (radians * 180) / Math.PI;
export const rad = (degres: number): number => (degres * Math.PI) / 180;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export function circleRect(c: Circle, r: Rect): boolean {
  const nx = clamp(c.x, r.x, r.x + r.w);
  const ny = clamp(c.y, r.y, r.y + r.h);
  const dx = c.x - nx;
  const dy = c.y - ny;
  return dx * dx + dy * dy <= c.r * c.r;
}

export function circleCircle(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.r + b.r;
  return dx * dx + dy * dy <= r * r;
}

export function rectRect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
