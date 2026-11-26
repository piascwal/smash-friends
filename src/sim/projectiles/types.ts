/* Projectiles : boules de feu, palets, ondes au sol… Chacun a un type de trajectoire et une frappe. */
import type { HitboxDef } from '../moves/types';

export type ProjectileId =
  | 'orbe'
  | 'boule_feu'
  | 'onde_sol'
  | 'eclat_glace'
  | 'pic_glace'
  | 'palet'
  | 'balle_padel'
  | 'rayon'
  | 'paume'
  | 'biere'
  | 'esprit'
  | 'mandala'
  | 'projecteur'
  | 'chien'
  | 'ballon'
  | 'onde_son';

export type ProjectilePath =
  /** Tout droit. */
  | 'straight'
  /** Glisse au ras du sol, s'arrête au bord. */
  | 'ground'
  /** Lancer en cloche, se brise à l'impact. */
  | 'lob'
  /** Rebondit au sol plusieurs fois. */
  | 'bounce'
  /** Suit l'adversaire le plus proche. */
  | 'homing'
  /** Tombe du ciel devant le lanceur après un délai. */
  | 'column'
  /** Jaillit du sol devant le lanceur. */
  | 'pillar';

export type ProjectileHit = Omit<HitboxDef, 'start' | 'end' | 'x' | 'y' | 'r'>;

export interface ProjectileDef {
  id: ProjectileId;
  /** Image de la banque (projectile du personnage), ou animation ; absente : dessinée (orbe). */
  image?: string;
  anim?: string[];
  path: ProjectilePath;
  speed: number;
  /** Vitesse verticale de départ (vers le bas positif). */
  vy?: number;
  gravity?: number;
  bounces?: number;
  /** Durée de vie (images). */
  life: number;
  radius: number;
  /** Largeur à l'écran (pixels du monde). */
  width: number;
  hit: ProjectileHit;
  /** Continue sa route après avoir touché (frappe de nouveau toutes les `rehit` images). */
  pierce?: boolean;
  /** Projectiles du même type présents en même temps, par lanceur. */
  max: number;
  /** Images avant d'être dangereux (colonnes, piliers). */
  delay?: number;
  /** Vitesse de rotation à l'écran (tours par seconde). */
  spin?: number;
  /** Couleur (orbe dessinée, lueur). */
  color: string;
  /** Distance devant le lanceur où il apparaît (colonne, pilier). */
  reach?: number;
}
