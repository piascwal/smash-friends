/* Un combattant : position, vitesse, état, pourcents, vies… Les règles qui le font évoluer sont dans
   les modules voisins (sol, air, défense, dégâts, rebord, coups). */
import { SHIELD } from '../core/config';
import type { Rect } from '../core/math';
import type { Item } from '../items/item';
import { buildMoveset } from '../moves/moveset';
import type { MoveDef, Moveset } from '../moves/types';
import type { FighterDef, Stats } from '../roster/types';
import type { Ledge, Platform } from '../stage/platforms';
import { ControlReader } from './controls';

export type StateId =
  | 'idle'
  | 'walk'
  | 'dash'
  | 'run'
  | 'crouch'
  | 'jumpsquat'
  | 'air'
  | 'landing'
  | 'move'
  | 'shield'
  | 'shieldstun'
  | 'shieldrelease'
  | 'roll'
  | 'spotdodge'
  | 'airdodge'
  | 'hitstun'
  | 'tumble'
  | 'helpless'
  | 'knockdown'
  | 'getup'
  | 'tech'
  | 'ledge'
  | 'ledgeclimb'
  | 'ledgeroll'
  | 'dizzy'
  | 'dead'
  | 'respawn'
  | 'win';

export interface ActiveMove {
  def: MoveDef;
  /** Image du coup (n'avance pas pendant la charge). */
  frame: number;
  /** Images de charge accumulées. */
  charge: number;
  charging: boolean;
  chargeDone: boolean;
  /** Dernière frappe donnée à chaque victime (numéro → image du coup). */
  readonly hits: Map<number, number>;
  /** Le coup suivant de l'enchaînement est demandé. */
  chained: boolean;
  /** Smash lancé par direction + A : relâché avant la charge, il devient ce coup rapide (tilt). */
  tilt?: string;
  /** Coup de poing lancé stick au neutre : si le stick est poussé juste après (A tenu), c'est un smash. */
  holdSmash?: boolean;
}

export interface FighterStats {
  kos: number;
  falls: number;
  selfDestructs: number;
  damageDealt: number;
  damageTaken: number;
}

export class Fighter {
  readonly stats: Stats;
  readonly moves: Moveset;
  readonly ctl = new ControlReader();

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  /** Vitesse d'éjection, freinée à chaque image (séparée de la vitesse propre). */
  kbx = 0;
  kby = 0;
  facing: 1 | -1 = 1;

  state: StateId = 'idle';
  /** Images passées dans l'état courant. */
  t = 0;
  /** Durée prévue de l'état courant (atterrissage, étourdissement, roulade…). */
  duration = 0;

  grounded = false;
  platform: Platform | null = null;
  /** Images pendant lesquelles on traverse les plateformes fines. */
  dropThrough = 0;
  jumpsLeft = 0;
  airdodged = false;
  sideSpecialUsed = false;
  fastFalling = false;

  percent = 0;
  stocks = 3;
  /** Points en mode temps (éjections données moins chutes). */
  score = 0;
  hitstun = 0;
  /** Arrêt sur image après un impact : le combattant ne bouge plus, il tremble. */
  hitlag = 0;
  /** Éjection en attente pendant l'arrêt sur image (l'influence directionnelle s'applique à la fin). */
  pendingLaunch: { kb: number; angle: number } | null = null;
  shield: number = SHIELD.max;
  intangible = 0;
  /** Invincibilité longue (réapparition, étoile). */
  invincible = 0;
  starPower = 0;
  frozen = 0;

  move: ActiveMove | null = null;
  ledge: Ledge | null = null;
  ledgeInvincibleReady = true;
  regrab = 0;

  item: Item | null = null;
  /** Direction et force du prochain lancer d'objet. */
  throwAim = { x: 0, y: 0, strong: false };
  rollDir: 1 | -1 = 1;
  techRoll = false;
  lastHitBy = -1;
  lastHitFrame = -9999;
  respawnTimer = 0;
  /** Image de l'élimination (classement). */
  eliminatedAt = 0;
  /** Rotation à l'écran d'un combattant en vrille (degrés). */
  spin = 0;
  /** Saut au stick (sinon, seulement au bouton). */
  tapJump = true;
  readonly record: FighterStats = { kos: 0, falls: 0, selfDestructs: 0, damageDealt: 0, damageTaken: 0 };

  constructor(
    readonly slot: number,
    readonly def: FighterDef,
    readonly team: number,
    readonly cpuLevel: number,
  ) {
    this.stats = def.stats;
    this.moves = buildMoveset(def);
    this.jumpsLeft = this.stats.airJumps;
  }

  get size(): number {
    return this.stats.size;
  }

  get alive(): boolean {
    return this.state !== 'dead';
  }

  get eliminated(): boolean {
    return this.state === 'dead' && this.stocks <= 0;
  }

  /** Hauteur de la zone sensible selon la posture. */
  get height(): number {
    const h =
      this.state === 'crouch'
        ? 62
        : this.state === 'knockdown'
          ? 30
          : this.state === 'ledge'
            ? 80
            : this.grounded
              ? 100
              : 88;
    return h * this.size;
  }

  get width(): number {
    return 44 * this.size;
  }

  hurtbox(): Rect {
    const w = this.width;
    const h = this.height;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  /** Centre du corps (effets, cibles de l'IA). */
  get cx(): number {
    return this.x;
  }
  get cy(): number {
    return this.y - this.height / 2;
  }

  setState(s: StateId, duration = 0): void {
    this.state = s;
    this.t = 0;
    this.duration = duration;
    if (s !== 'move') this.move = null;
  }

  /** Touchable par les coups (intangibilité, invincibilité, mort). */
  get vulnerable(): boolean {
    return (
      this.alive &&
      this.state !== 'respawn' &&
      this.intangible <= 0 &&
      this.invincible <= 0 &&
      !this.moveIntangible()
    );
  }

  private moveIntangible(): boolean {
    const r = this.move?.def.intangible;
    return !!r && !!this.move && this.move.frame >= r[0] && this.move.frame <= r[1];
  }

  /** Fenêtre d'une propriété de coup (contre, renvoi, armure) active à cette image ? */
  moveWindow(key: 'counter' | 'reflect' | 'armor'): boolean {
    const r = this.move?.def[key];
    return !!r && !!this.move && !this.move.charging && this.move.frame >= r[0] && this.move.frame <= r[1];
  }

  resetAirOptions(): void {
    this.jumpsLeft = this.stats.airJumps;
    this.airdodged = false;
    this.sideSpecialUsed = false;
    this.fastFalling = false;
  }
}
