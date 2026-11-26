/* Ce que les modules de la simulation voient du match en cours (évite les dépendances circulaires). */
import type { Rng } from './core/rng';
import type { Fighter } from './fighter/fighter';
import type { Item } from './items/item';
import type { GameEvent } from './match/events';
import type { Projectile } from './projectiles/projectile';
import type { ProjectileId } from './projectiles/types';
import type { StageRuntime } from './stage/platforms';

export interface World {
  readonly frame: number;
  readonly stage: StageRuntime;
  readonly rng: Rng;
  readonly fighters: readonly Fighter[];
  readonly items: Item[];
  readonly projectiles: Projectile[];
  /** Les coéquipiers peuvent-ils se blesser ? */
  readonly friendlyFire: boolean;
  emit(e: GameEvent): void;
  spawnProjectile(owner: Fighter, id: ProjectileId): void;
  /** Explosion à cet endroit (objets, coups) : frappe tout ce qui est dans le rayon. */
  explode(x: number, y: number, r: number, dmg: number, bkb: number, kbg: number, by: number): void;
}
