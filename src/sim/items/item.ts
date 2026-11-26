/* Un objet en jeu : posé, porté ou en vol. */
import type { ItemDef } from './types';

let nextUid = 1;

export class Item {
  readonly uid = nextUid++;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  grounded = false;
  /** Combattant qui le tient (numéro), ou -1. */
  holder = -1;
  /** Lancé par (numéro) : ne touche pas son lanceur ni ses équipiers. */
  thrownBy = -1;
  thrownTeam = -1;
  /** En vol et dangereux. */
  flying = false;
  age = 0;
  ammo: number;
  angle = 0;
  bounces = 0;
  dead = false;
  /** Frappes déjà données pendant ce vol (numéro de la victime). */
  readonly hits = new Set<number>();
  /** Coups encaissés (caisses : se brisent au bout de quelques coups). */
  damage = 0;
  /** Apparition : petit scintillement avant de tomber. */
  spawning = 30;
  /** Images depuis le lancer (le frisbee revient au bout d'un moment). */
  flightTime = 0;

  constructor(
    readonly def: ItemDef,
    x: number,
    y: number,
  ) {
    this.x = x;
    this.y = y;
    this.ammo = def.ammo ?? 0;
  }
}
