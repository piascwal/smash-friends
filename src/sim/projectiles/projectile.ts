/* Un projectile en vol. */
import type { ProjectileDef } from './types';

let nextUid = 1;

export class Projectile {
  readonly uid = nextUid++;
  age = 0;
  bounces = 0;
  dead = false;
  /** Multiplicateur de puissance (un renvoi le rend plus fort). */
  power = 1;
  /** Dernière frappe donnée à chaque victime (numéro → image), pour les projectiles qui traversent. */
  readonly hits = new Map<number, number>();
  /** Le sol sous un projectile qui glisse (onde, palet) : sa hauteur. */
  groundY: number | null = null;

  constructor(
    readonly def: ProjectileDef,
    public owner: number,
    public team: number,
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public facing: 1 | -1,
  ) {}
}
