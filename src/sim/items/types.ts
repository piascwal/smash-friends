/* Objets : ils tombent du ciel pendant le combat. On les ramasse (attaque à côté), on frappe avec,
   on tire avec, ou on les lance. Les images viennent des objets de décor de la banque. */
import type { ProjectileHit } from '../projectiles/types';

export type ItemId =
  | 'caisse'
  | 'tonneau'
  | 'baril'
  | 'dauphin'
  | 'frisbee'
  | 'pile'
  | 'baladeur'
  | 'donuts'
  | 'cd'
  | 'coeur'
  | 'etoile';

export type ItemKind =
  /** Caisse, tonneau : lourds à porter, se brisent en libérant d'autres objets. */
  | 'container'
  /** Baril, pile : explosent au choc. */
  | 'explosive'
  /** Dauphin : arme de corps à corps (la batte du genre). */
  | 'melee'
  /** Frisbee, boîtier de CD : à lancer. */
  | 'throwable'
  /** Baladeur : tire des ondes. */
  | 'shooter'
  /** Donuts, cœur : soignent dès qu'on les ramasse. */
  | 'heal'
  /** Étoile : invincibilité. */
  | 'star';

export interface Explosion {
  r: number;
  dmg: number;
  bkb: number;
  kbg: number;
  effect?: 'fire' | 'electric';
}

export interface ItemDef {
  id: ItemId;
  name: string;
  kind: ItemKind;
  /** Objet de décor de la banque ; absent : dessiné par le jeu. */
  image?: string;
  width: number;
  radius: number;
  /** Frappe quand il est lancé (vitesse suffisante). */
  thrown: ProjectileHit;
  /** Fréquence relative d'apparition. */
  weight: number;
  heavy?: boolean;
  explosion?: Explosion;
  ammo?: number;
  heal?: number;
  /** Revient vers le lanceur. */
  boomerang?: boolean;
  /** Durée de vie au sol (images). */
  life: number;
}
