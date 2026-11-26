/* Lecture des commandes d'un combattant au fil des images : boutons pressés (avec tampon), stick
   « claqué » (smash au stick, saut au stick, passage à travers une plateforme), stick C. */
import { PHYSICS } from '../core/config';
import { BUTTONS, NEUTRAL, held, type Button, type Controls } from '../core/input';

const NAMES = Object.keys(BUTTONS) as Button[];
const HISTORY = 4;

export type Direction = 'neutral' | 'up' | 'down' | 'forward' | 'back';

export class ControlReader {
  cur: Controls = NEUTRAL;
  prev: Controls = NEUTRAL;
  private frame = 0;
  private readonly pressedAt = new Map<Button, number>();
  private readonly consumedAt = new Map<Button, number>();
  private readonly history: { x: number; y: number }[] = [];

  update(c: Controls): void {
    this.prev = this.cur;
    this.cur = c;
    this.frame++;
    for (const b of NAMES) if (held(c, b) && !held(this.prev, b)) this.pressedAt.set(b, this.frame);
    this.history.push({ x: this.prev.x, y: this.prev.y });
    if (this.history.length > HISTORY) this.history.shift();
  }

  held(b: Button): boolean {
    return held(this.cur, b);
  }

  /** Bouton pressé récemment (tampon) et pas encore utilisé. */
  pressed(b: Button, window: number = PHYSICS.buffer): boolean {
    const at = this.pressedAt.get(b);
    return at !== undefined && this.frame - at <= window && this.consumedAt.get(b) !== at;
  }

  /** Marque l'appui comme utilisé (un appui ne déclenche qu'une action). */
  consume(b: Button): void {
    const at = this.pressedAt.get(b);
    if (at !== undefined) this.consumedAt.set(b, at);
  }

  /** Images écoulées depuis le dernier appui (pour la fenêtre de récupération, d'annulation…). */
  since(b: Button): number {
    const at = this.pressedAt.get(b);
    return at === undefined ? Infinity : this.frame - at;
  }

  /** Stick claqué horizontalement (de presque neutre à presque au bout en peu d'images) : -1, 0 ou 1. */
  flickX(): -1 | 0 | 1 {
    if (Math.abs(this.cur.x) < 0.75) return 0;
    const wasNeutral = this.history.some(
      (h) => Math.abs(h.x) < 0.3 || Math.sign(h.x) !== Math.sign(this.cur.x),
    );
    return wasNeutral && Math.abs(this.prev.x) < 0.75 ? (this.cur.x < 0 ? -1 : 1) : 0;
  }

  flickY(): -1 | 0 | 1 {
    if (Math.abs(this.cur.y) < 0.7) return 0;
    const wasNeutral = this.history.some((h) => Math.abs(h.y) < 0.3);
    return wasNeutral && Math.abs(this.prev.y) < 0.7 ? (this.cur.y < 0 ? -1 : 1) : 0;
  }

  /** Stick C poussé à l'instant : sa direction (smash ou aérien directionnel). */
  cstick(): { x: number; y: number } | null {
    const m = Math.hypot(this.cur.cx, this.cur.cy);
    const pm = Math.hypot(this.prev.cx, this.prev.cy);
    return m > 0.6 && pm <= 0.6 ? { x: this.cur.cx, y: this.cur.cy } : null;
  }

  /** Direction du stick relative à l'orientation du combattant. */
  direction(facing: number, x = this.cur.x, y = this.cur.y): Direction {
    if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3) return 'neutral';
    if (Math.abs(y) > Math.abs(x) * 0.9) return y < 0 ? 'up' : 'down';
    return Math.sign(x) === facing ? 'forward' : 'back';
  }
}
