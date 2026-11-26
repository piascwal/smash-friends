/* Un écran de l'application (menu, sélection, combat…). */
import type { NavAction } from '../input/device';

export interface Screen {
  readonly el: HTMLElement;
  /** Action de navigation ; renvoie true si l'écran l'a traitée (sinon : focus et clic par défaut). */
  nav?(a: NavAction, from: string): boolean | void;
  /** Appelé à chaque image d'affichage. */
  frame?(now: number): void;
  /** Retour arrière (bouton B, Échap). */
  back?(): void;
  leave?(): void;
}
