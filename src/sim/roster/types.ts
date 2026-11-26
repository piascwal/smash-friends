/* Les caractéristiques de jeu d'un personnage (propres à ce jeu : la banque ne fournit que les images). */
import type { MoveDef } from '../moves/types';

export interface Stats {
  /** 100 = poids moyen ; les lourds volent moins loin. */
  weight: number;
  /** Échelle du personnage (zone de coups, zone sensible, sprite). */
  size: number;
  walk: number;
  run: number;
  /** Impulsions de saut (px/image). */
  jump: number;
  shortHop: number;
  doubleJump: number;
  /** Sauts en l'air disponibles. */
  airJumps: number;
  gravity: number;
  fall: number;
  fastFall: number;
  air: number;
  airAccel: number;
  /** Multiplicateur de dégâts de ses coups. */
  power: number;
  /** Multiplicateur de durée de ses coups (< 1 : plus vif). */
  speed: number;
}

export interface Specials {
  nspecial: MoveDef;
  sspecial: MoveDef;
  uspecial: MoveDef;
  dspecial: MoveDef;
  /** Variante en l'air, quand elle diffère. */
  nspecial_air?: MoveDef;
  dspecial_air?: MoveDef;
  /** Coups annexes (riposte d'un contre…). */
  extra?: MoveDef[];
}

export interface FighterDef {
  id: string;
  /** Style de combat (celui de la banque : il donne les images des coups spéciaux). */
  style: string;
  archetype: string;
  stats: Stats;
  specials: Specials;
  /** Pose de l'attaque en course. */
  dashPose?: MoveDef['pose'];
}
