/* Description d'un coup : sa durée, ses zones de frappe image par image, son mouvement et ses
   propriétés (charge, contre, renvoi, armure…). Toutes les valeurs sont pour un combattant de taille 1 ;
   les distances sont des pixels du monde, mesurées depuis les pieds (x vers l'avant, y vers le bas). */
import type { PoseKey } from './poses';
import type { ProjectileId } from '../projectiles/types';

export type Effect = 'normal' | 'fire' | 'electric' | 'ice' | 'slash';

export interface HitboxDef {
  /** Images actives, bornes comprises (comptées depuis le début du coup, charge exclue). */
  start: number;
  end: number;
  x: number;
  y: number;
  r: number;
  dmg: number;
  /** Degrés : 0 vers l'avant, 90 vers le haut, 270 vers le bas (météore), 361 angle « Sakurai ». */
  angle: number;
  /** Éjection de base et croissance (formule de Melee). */
  bkb: number;
  kbg: number;
  /** Éjection fixe (ne dépend pas des pourcents) : chopes, petits coups d'enchaînement. */
  wkb?: number;
  effect?: Effect;
  /** Une même zone ne touche qu'une fois par coup, sauf coups multiples : nouvelle frappe toutes les `rehit` images. */
  rehit?: number;
  /** Zone de saisie (passe le bouclier, ne fait pas de dégâts). */
  grab?: boolean;
  /** Envoie vers l'arrière du lanceur (coups qui frappent derrière). */
  behind?: boolean;
}

export interface MotionStep {
  frame: number;
  /** Vitesse imposée, x vers l'avant du combattant. Absente : inchangée. */
  vx?: number;
  vy?: number;
  /** Multiplie la gravité à partir de cette image. */
  gravity?: number;
}

export type MoveKind = 'ground' | 'air' | 'special' | 'grab' | 'throw' | 'item';

export interface MoveDef {
  id: string;
  kind: MoveKind;
  pose: PoseKey;
  /** Pose de préparation, montrée avant `windupEnd` (et pendant la charge d'un smash). */
  windup?: PoseKey;
  windupEnd?: number;
  total: number;
  hitboxes: HitboxDef[];
  /** Smash ou spécial à charger : à l'image `frame`, tant que le bouton est tenu (au plus `max` images). */
  charge?: { frame: number; max: number; button: 'attack' | 'special' | 'smash'; bonus: number };
  /** Lag à l'atterrissage pendant un aérien. */
  landingLag?: number;
  motion?: MotionStep[];
  /** Fini en l'air : chute impuissante jusqu'au sol (ou au rebord). */
  helpless?: boolean;
  /** Contrôle en l'air pendant le coup (1 = normal). */
  airControl?: number;
  /** Plages d'images [début, fin] : intangible, armure, contre, renvoi des projectiles. */
  intangible?: [number, number];
  armor?: [number, number];
  counter?: [number, number];
  reflect?: [number, number];
  /** Projectile lancé à cette image. */
  projectile?: { frame: number; id: ProjectileId };
  /** Coup suivant de l'enchaînement (jab 1-2-3) si l'on rappuie dans la fenêtre. */
  next?: { id: string; from: number; to: number };
  /** Peut saisir un rebord pendant le coup (remontées). */
  ledgeGrab?: boolean;
  /** Atterrir arrête le coup (spéciaux aériens). */
  endOnLanding?: boolean;
  /** Habillage : inclinaison, vrilles, image retournée à mi-coup, étirement, traînée. */
  fx?: MoveFx;
  sfx?: 'light' | 'medium' | 'heavy' | 'smash' | 'special' | 'whoosh';
}

export interface MoveFx {
  rot?: number;
  spins?: number;
  flipAt?: number;
  mirror?: boolean;
  stretch?: number;
  trail?: string;
}

export const MOVE_SLOTS = [
  'jab1',
  'jab2',
  'jab3',
  'ftilt',
  'utilt',
  'dtilt',
  'dash',
  'fsmash',
  'usmash',
  'dsmash',
  'nair',
  'fair',
  'bair',
  'uair',
  'dair',
  'nspecial',
  'sspecial',
  'uspecial',
  'dspecial',
  'grab',
  'dashgrab',
  'pummel',
  'fthrow',
  'bthrow',
  'uthrow',
  'dthrow',
  'getup',
  'ledge',
] as const;

export type MoveSlot = (typeof MOVE_SLOTS)[number];
export type Moveset = Record<MoveSlot, MoveDef> & { [id: string]: MoveDef };

/** Raccourci d'écriture d'une zone de frappe. */
export function hb(
  start: number,
  end: number,
  x: number,
  y: number,
  r: number,
  dmg: number,
  angle: number,
  bkb: number,
  kbg: number,
  extra: Partial<HitboxDef> = {},
): HitboxDef {
  return { start, end, x, y, r, dmg, angle, bkb, kbg, ...extra };
}
