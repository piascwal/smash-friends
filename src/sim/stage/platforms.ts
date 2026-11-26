/* Les plateformes en jeu : position courante (les mobiles bougent), déplacement de la dernière image
   (pour emporter ce qui est posé dessus) et rebords. */
import type { PlatformDef, StageDef } from './types';

export class Platform {
  x: number;
  y: number;
  /** Déplacement à la dernière image. */
  dx = 0;
  dy = 0;

  constructor(
    readonly def: PlatformDef,
    readonly index: number,
  ) {
    this.x = def.x;
    this.y = def.y;
  }

  get w(): number {
    return this.def.w;
  }
  get h(): number {
    return this.def.h;
  }
  get solid(): boolean {
    return this.def.solid;
  }

  /** Avance le mouvement de la plateforme jusqu'à l'image `frame`. */
  update(frame: number): void {
    const m = this.def.move;
    if (!m) return;
    const t = ((frame + (m.phase ?? 0)) / m.period) * Math.PI * 2;
    const nx = this.def.x + Math.sin(t) * m.dx;
    const ny = this.def.y + Math.sin(t) * m.dy;
    this.dx = nx - this.x;
    this.dy = ny - this.y;
    this.x = nx;
    this.y = ny;
  }

  /** Le point x est-il au-dessus de la plateforme ? */
  covers(x: number, marge = 0): boolean {
    return x >= this.x - marge && x <= this.x + this.w + marge;
  }
}

export interface Ledge {
  platform: Platform;
  /** -1 : bout gauche, 1 : bout droit. */
  side: -1 | 1;
}

export const ledgeX = (l: Ledge): number => (l.side < 0 ? l.platform.x : l.platform.x + l.platform.w);
export const ledgeY = (l: Ledge): number => l.platform.y;
export const ledgeKey = (l: Ledge): string => `${l.platform.index}:${l.side}`;

export class StageRuntime {
  readonly platforms: Platform[];
  readonly ledges: Ledge[];

  constructor(readonly def: StageDef) {
    this.platforms = def.platforms.map((p, i) => new Platform(p, i));
    this.ledges = this.platforms
      .filter((p) => p.solid && p.def.ledges)
      .flatMap((p) => [
        { platform: p, side: -1 as const },
        { platform: p, side: 1 as const },
      ]);
  }

  update(frame: number): void {
    for (const p of this.platforms) p.update(frame);
  }

  /** La plateforme pleine principale (la plus large). */
  get main(): Platform {
    return this.platforms.filter((p) => p.solid).reduce((a, b) => (b.w > a.w ? b : a));
  }

  /**
   * Le sol trouvé en descendant de `y0` à `y1` au point x : la plateforme dont le dessus est franchi.
   * Les plateformes fines ne comptent pas si `dropThrough` (on passe au travers en appuyant vers le bas).
   */
  landing(x: number, y0: number, y1: number, dropThrough: boolean): Platform | null {
    let best: Platform | null = null;
    for (const p of this.platforms) {
      if (!p.covers(x)) continue;
      if (!p.solid && dropThrough) continue;
      // le dessus de la plateforme a pu bouger pendant l'image : on compare à sa position précédente aussi
      const top = p.y;
      const prevTop = p.y - p.dy;
      if (y0 <= Math.max(top, prevTop) + 0.5 && y1 >= top) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }
}
