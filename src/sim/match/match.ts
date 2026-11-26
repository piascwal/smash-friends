/* Un combat : la boucle d'une image (compte à rebours, combattants, projectiles, objets, frappes,
   éjections, chrono) et ce que le rendu lit. Sans navigateur : tourne aussi dans les tests et chez
   l'hôte d'une partie en réseau. */
import { dealHit, shieldHit } from '../combat/apply';
import { resolveFighterHits, resolveProjectileHits } from '../combat/hits';
import { FPS } from '../core/config';
import { NEUTRAL, type Controls } from '../core/input';
import { Rng } from '../core/rng';
import { Fighter } from '../fighter/fighter';
import { updateFighter, type FighterHooks } from '../fighter/update';
import { throwItem } from '../items/carry';
import type { Item } from '../items/item';
import { ItemSpawner } from '../items/spawner';
import { explodeItem } from '../items/update';
import { updateItems } from '../items/update';
import { spawnProjectile } from '../projectiles/update';
import { updateProjectiles } from '../projectiles/update';
import type { Projectile } from '../projectiles/projectile';
import type { ProjectileId } from '../projectiles/types';
import { fighterDef } from '../roster/characters';
import { StageRuntime } from '../stage/platforms';
import { stageParId } from '../stage/stages';
import type { World } from '../world';
import { effectiveTeam, type MatchConfig } from './config';
import type { GameEvent } from './events';
import { blastSide, knockOut, updateDead, updateRespawn } from './ko';
import { isOver, leadingTeams, rank, teamsAlive, type Ranking } from './rules';

export type Phase = 'countdown' | 'fight' | 'gameover';

/** Cerveau d'un combattant piloté par l'ordinateur (voir ai/). */
export interface Brain {
  think(m: Match, f: Fighter): Controls;
}

const COUNTDOWN = 3 * FPS;

export class Match implements World {
  frame = 0;
  phase: Phase = 'countdown';
  /** Images restantes au chrono (mode temps). */
  timeLeft: number;
  suddenDeath = false;
  readonly stage: StageRuntime;
  readonly rng: Rng;
  readonly fighters: Fighter[];
  readonly items: Item[] = [];
  readonly projectiles: Projectile[] = [];
  readonly friendlyFire: boolean;
  winningTeam: number | null = null;
  private events: GameEvent[] = [];
  private readonly spawner: ItemSpawner;
  private readonly hooks: FighterHooks;

  constructor(
    readonly config: MatchConfig,
    readonly brains: (Brain | null)[] = [],
  ) {
    this.rng = new Rng(config.seed);
    this.stage = new StageRuntime(stageParId(config.stageId));
    this.friendlyFire = config.friendlyFire;
    this.timeLeft = config.minutes * 60 * FPS;
    this.fighters = config.players.map((p, i) => {
      const f = new Fighter(p.slot, fighterDef(p.charId), effectiveTeam(p, config.teams), p.cpu);
      const sp = this.stage.def.spawns[i % this.stage.def.spawns.length]!;
      f.x = sp.x;
      f.y = sp.y;
      f.facing = sp.x > 0 ? -1 : 1;
      f.stocks = config.mode === 'stock' ? config.stocks : 0;
      f.tapJump = p.tapJump ?? true;
      const p0 = this.stage.landing(f.x, f.y - 5, f.y + 5, false);
      if (p0) Object.assign(f, { grounded: true, platform: p0 });
      return f;
    });
    this.spawner = new ItemSpawner(config.items, this);
    this.hooks = {
      throwItem: (f, w) => throwItem(f, w),
    };
  }

  emit(e: GameEvent): void {
    this.events.push(e);
  }

  /** Les événements de l'image (à lire une fois par le rendu et le son). */
  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  fighter(slot: number): Fighter | undefined {
    return this.fighters.find((f) => f.slot === slot);
  }

  spawnProjectile(owner: Fighter, id: ProjectileId): void {
    spawnProjectile(this, owner, id);
  }

  explode(x: number, y: number, r: number, dmg: number, bkb: number, kbg: number, by: number): void {
    this.emit({ type: 'explosion', x, y, r });
    for (const v of this.fighters) {
      if (!v.vulnerable && v.state !== 'shield') continue;
      const d = Math.hypot(v.cx - x, v.cy - y);
      if (d > r + v.width / 2) continue;
      const ctx = { by, x, y, dir: v.x < x ? -1 : 1 };
      if (v.state === 'shield' || v.state === 'shieldstun') shieldHit(this, v, dmg, ctx);
      else dealHit(this, v, { dmg, angle: 60, bkb, kbg, effect: 'fire' }, ctx);
    }
    for (const it of this.items) {
      if (!it.dead && it.def.explosion && Math.hypot(it.x - x, it.y - y) < r) explodeItem(this, it);
    }
  }

  /** Avance d'une image. `inputs[slot]` : commandes des humains (les IA pensent elles-mêmes). */
  step(inputs: readonly (Controls | undefined)[]): void {
    this.frame++;
    this.stage.update(this.frame);
    if (this.phase === 'countdown') return this.countdown();
    const timed = this.config.mode === 'time' && !this.suddenDeath;
    for (const f of this.fighters) {
      const input = this.phase === 'gameover' ? NEUTRAL : this.inputFor(f, inputs);
      if (f.state === 'dead') updateDead(f, this, timed);
      else if (f.state === 'respawn') {
        f.ctl.update(input);
        updateRespawn(f);
      } else updateFighter(f, this, input, this.hooks);
    }
    updateProjectiles(this);
    updateItems(this);
    if (this.phase === 'fight') this.spawner.update(this);
    resolveFighterHits(this);
    resolveProjectileHits(this);
    for (const f of this.fighters) {
      if (!f.alive || f.state === 'respawn') continue;
      const side = blastSide(f, this);
      if (side) knockOut(f, this, side, timed);
    }
    if (this.phase === 'fight') this.checkEnd();
  }

  private inputFor(f: Fighter, inputs: readonly (Controls | undefined)[]): Controls {
    const brain = this.brains[f.slot];
    if (brain) return brain.think(this, f);
    return inputs[f.slot] ?? NEUTRAL;
  }

  private countdown(): void {
    const left = COUNTDOWN - this.frame;
    if (left > 0 && left % FPS === 0) this.emit({ type: 'countdown', n: left / FPS });
    if (this.frame === 1) this.emit({ type: 'countdown', n: 3 });
    if (left <= 0) {
      this.phase = 'fight';
      this.emit({ type: 'go' });
    }
  }

  private checkEnd(): void {
    if (this.config.mode === 'time' && !this.suddenDeath) this.timeLeft--;
    if (!isOver(this.fighters, this.suddenDeath ? 'stock' : this.config.mode, this.timeLeft)) return;
    if (this.config.mode === 'time' && !this.suddenDeath) {
      const leaders = leadingTeams(this.fighters);
      if (leaders.length > 1) return this.startSuddenDeath(leaders);
      this.winningTeam = leaders[0] ?? null;
    } else this.winningTeam = [...teamsAlive(this.fighters)][0] ?? null;
    this.phase = 'gameover';
    this.emit({ type: 'game' });
  }

  /** Mort subite : les ex aequo repartent à 300 %, une vie chacun. */
  private startSuddenDeath(teams: number[]): void {
    this.suddenDeath = true;
    for (const f of this.fighters) {
      const inIt = teams.includes(f.team);
      f.stocks = inIt ? 1 : 0;
      if (!inIt) {
        f.setState('dead');
        f.eliminatedAt = this.frame;
      } else if (f.alive) f.percent = 300;
      else f.respawnTimer = 1;
      if (inIt) f.percent = 300;
    }
    this.emit({ type: 'suddenDeath' });
  }

  ranking(): Ranking[] {
    return rank(this.fighters, this.config.mode, this.winningTeam);
  }
}
