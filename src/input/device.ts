/* Un périphérique de jeu : clavier (deux moitiés), manette, écran tactile. Il donne les commandes
   d'une image, et des actions de navigation pour les menus. */
import type { Controls } from '../sim/core/input';

export type NavAction = 'up' | 'down' | 'left' | 'right' | 'ok' | 'back' | 'start' | 'prev' | 'next';

export interface Device {
  readonly id: string;
  readonly label: string;
  /** Le saut au stick est-il pratique sur ce périphérique ? (non au clavier). */
  readonly tapJump: boolean;
  read(): Controls;
}

/** Transforme des boutons en appuis de navigation (avec répétition quand on maintient). */
export class NavRepeater {
  private held = new Map<NavAction, number>();

  update(active: Set<NavAction>, emit: (a: NavAction) => void): void {
    for (const a of active) {
      const n = (this.held.get(a) ?? 0) + 1;
      this.held.set(a, n);
      if (n === 1 || (n > 22 && n % 6 === 0 && ['up', 'down', 'left', 'right'].includes(a))) emit(a);
    }
    for (const a of [...this.held.keys()]) if (!active.has(a)) this.held.delete(a);
  }
}
