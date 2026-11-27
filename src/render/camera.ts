/* La caméra : cadre tous les combattants (zoom dynamique), tremble aux impacts,
   et peut zoomer sur une cible (coup fatal). */
import { clamp, lerp } from '../sim/core/math';
import type { Match } from '../sim/match/match';

export class Camera {
  x = 0;
  y = -150;
  zoom = 1;
  private shake = 0;
  /** 0 : secousses désactivées (préférence). */
  shakeScale = 1;
  private shakeX = 0;
  private shakeY = 0;
  /** Cadrage imposé (coup fatal, fin du combat) : point, zoom, images restantes. */
  focus: { x: number; y: number; zoom: number; frames: number } | null = null;

  addShake(amount: number): void {
    this.shake = Math.min(30, Math.max(this.shake, amount * this.shakeScale));
  }

  update(m: Match, viewW: number, viewH: number): void {
    const cam = m.stage.def.camera;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const f of m.fighters) {
      if (!f.alive) continue;
      minX = Math.min(minX, f.x);
      maxX = Math.max(maxX, f.x);
      minY = Math.min(minY, f.y - f.height);
      maxY = Math.max(maxY, f.y);
    }
    if (minX === Infinity) {
      minX = -300;
      maxX = 300;
      minY = -200;
      maxY = 0;
    }
    // marges, puis bornes du stage
    // marges autour des combattants : assez pour voir venir, pas trop pour qu'ils restent grands
    minX = Math.max(cam.left, minX - 220);
    maxX = Math.min(cam.right, maxX + 220);
    minY = Math.max(cam.top, minY - 170);
    maxY = Math.min(cam.bottom, Math.max(maxY + 150, 170));
    const w = Math.max(640, maxX - minX);
    const h = Math.max(400, maxY - minY);
    let zoom = Math.min(viewW / w, viewH / h);
    const fullZoom = Math.min(viewW / (cam.right - cam.left), viewH / (cam.bottom - cam.top));
    // au plus près, un combattant fait un quart de la hauteur de l'écran
    zoom = clamp(zoom, fullZoom, viewH / 400);
    let tx = (minX + maxX) / 2;
    let ty = (minY + maxY) / 2;
    if (this.focus) {
      tx = this.focus.x;
      ty = this.focus.y;
      zoom = (viewH / 420) * this.focus.zoom;
      if (--this.focus.frames <= 0) this.focus = null;
    }
    // la caméra ne montre pas au-delà des bornes du stage
    const halfW = viewW / zoom / 2;
    const halfH = viewH / zoom / 2;
    if (!this.focus) {
      tx = clamp(tx, cam.left + halfW, Math.max(cam.left + halfW, cam.right - halfW));
      ty = clamp(ty, cam.top + halfH, Math.max(cam.top + halfH, cam.bottom - halfH));
    }
    const k = this.focus ? 0.25 : 0.08;
    this.x = lerp(this.x, tx, k);
    this.y = lerp(this.y, ty, k);
    this.zoom = lerp(this.zoom, zoom, k);
    this.shake *= 0.86;
    if (this.shake < 0.3) this.shake = 0;
    this.shakeX = (Math.random() * 2 - 1) * this.shake;
    this.shakeY = (Math.random() * 2 - 1) * this.shake;
  }

  /** Place le contexte dans le repère du monde. */
  apply(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    ctx.translate(viewW / 2 + this.shakeX, viewH / 2 + this.shakeY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  toScreen(x: number, y: number, viewW: number, viewH: number): { x: number; y: number } {
    return { x: (x - this.x) * this.zoom + viewW / 2, y: (y - this.y) * this.zoom + viewH / 2 };
  }
}
