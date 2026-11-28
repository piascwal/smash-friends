/* Base du pixel art des stages : une grille de « gros pixels » (4 unités du monde), des teintes
   dérivées d'une couleur, et un bruit déterministe (le même dessin à chaque partie). */

export const PX = 4;

export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export const noise = (x: number, y: number): number => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Une toile de gros pixels, avec une marge autour de la zone utile (débords : herbe, racines, toits). */
export class PixelCanvas {
  readonly canvas: HTMLCanvasElement;
  private readonly g: CanvasRenderingContext2D;

  constructor(
    /** Taille de la zone utile, en gros pixels. */
    readonly cols: number,
    readonly rows: number,
    /** Marges en gros pixels : gauche/droite, haut, bas. */
    readonly padX: number,
    readonly padTop: number,
    readonly padBottom: number,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.max(1, cols + padX * 2);
    this.canvas.height = Math.max(1, rows + padTop + padBottom);
    this.g = this.canvas.getContext('2d')!;
  }

  /** Un pixel, en coordonnées de la zone utile (0,0 : coin haut gauche ; négatif : dans la marge). */
  px(x: number, y: number, color: string): void {
    this.g.fillStyle = color;
    this.g.fillRect(Math.round(x) + this.padX, Math.round(y) + this.padTop, 1, 1);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.g.fillStyle = color;
    this.g.fillRect(Math.round(x) + this.padX, Math.round(y) + this.padTop, Math.round(w), Math.round(h));
  }

  /** Disque plein (feuillages, nuages). */
  disc(cx: number, cy: number, r: number, color: string): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.5) this.px(cx + x, cy + y, color);
  }

  /** Dessin sur la toile en unités du monde : position du coin haut gauche de la zone utile. */
  draw(ctx: CanvasRenderingContext2D, worldX: number, worldY: number): void {
    ctx.drawImage(
      this.canvas,
      worldX - this.padX * PX,
      worldY - this.padTop * PX,
      this.canvas.width * PX,
      this.canvas.height * PX,
    );
  }
}
