/* Le cerveau d'un combattant IA, niveau 1 à 9 : temps de réaction, adresse (retour sur le stage,
   influence directionnelle, récupération au sol), défense et choix des coups. */
import { BUTTONS, NEUTRAL, type Controls } from '../core/input';
import { Rng } from '../core/rng';
import type { Fighter } from '../fighter/fighter';
import type { Brain, Match } from '../match/match';
import { ctrl } from './inputs';
import { useItem, wantsItem } from './items';
import { chooseAttack, defend, pickTarget, threatened } from './neutral';
import { ledgeOption, offstage, recover, survivalDI } from './recovery';

const BUSY = new Set([
  'move',
  'jumpsquat',
  'landing',
  'roll',
  'spotdodge',
  'airdodge',
  'shieldstun',
  'getup',
  'tech',
]);

export class CpuBrain implements Brain {
  private queue: Controls[] = [];
  private wait = 0;
  private goalX: number | null = null;
  private last: Controls = NEUTRAL;
  private ledgeWait = 0;
  private readonly rng: Rng;

  constructor(
    readonly level: number,
    seed: number,
  ) {
    this.rng = new Rng(seed);
  }

  /** Adresse de 0 (niveau 1) à 1 (niveau 9). */
  private get skill(): number {
    return (this.level - 1) / 8;
  }

  private get reaction(): number {
    return Math.max(3, Math.round(28 - this.level * 2.7));
  }

  think(m: Match, f: Fighter): Controls {
    const out = this.decide(m, f);
    // un bouton tenu deux images de suite est relâché : chaque action est un nouvel appui
    const pressed = out.buttons & this.last.buttons & (BUTTONS.jump | BUTTONS.special);
    const c = pressed ? { ...out, buttons: out.buttons & ~pressed } : out;
    this.last = c;
    return c;
  }

  private decide(m: Match, f: Fighter): Controls {
    if (m.phase !== 'fight') return NEUTRAL;
    if (f.hitlag > 0 && f.pendingLaunch) return this.rng.chance(this.skill * 0.9) ? survivalDI(f) : NEUTRAL;
    if (f.state === 'dizzy') return ctrl(m.frame % 2 ? 1 : -1, 0, m.frame % 2 ? ['attack'] : ['jump']);
    if (f.state === 'respawn') return f.t > 50 ? ctrl(f.x < 0 ? 1 : -1, 0) : NEUTRAL;
    if (f.state === 'ledge') return this.onLedge(f);
    if ((f.state === 'tumble' || f.state === 'hitstun') && this.nearGround(m, f)) {
      return this.rng.chance(this.skill * 0.7) ? ctrl(this.rng.int(-1, 1), 0, ['shield']) : NEUTRAL;
    }
    if (offstage(m, f)) {
      this.queue = [];
      return recover(m, f, this.rng, this.skill);
    }
    if (this.queue.length) return this.queue.shift()!;
    if (BUSY.has(f.state) || f.hitstun > 0) return NEUTRAL;
    if (--this.wait > 0) return this.walk(m, f);
    this.wait = this.reaction + this.rng.int(0, this.reaction);
    this.plan(m, f);
    return this.queue.shift() ?? this.walk(m, f);
  }

  private plan(m: Match, f: Fighter): void {
    const t = pickTarget(m, f);
    if (!t) return;
    if (threatened(m, f) && this.rng.chance(0.15 + this.skill * 0.6)) {
      this.queue = defend(f, this.rng);
      return;
    }
    if (f.item) {
      const use = useItem(f, t, this.rng);
      if (use) return void (this.queue = use);
    } else {
      const it = wantsItem(m, f, this.level, this.rng);
      if (it) return void (this.goalX = it.x);
    }
    const attack = chooseAttack(m, f, t, this.rng, this.level);
    if (attack && this.rng.chance(0.45 + this.skill * 0.5)) {
      this.queue = attack;
      return;
    }
    this.goalX = t.x;
    if (t.cy < f.cy - 120 && this.rng.chance(0.4)) this.queue = [ctrl(0, 0, ['jump']), ctrl()];
    else if (t.cy > f.cy + 80 && f.platform && !f.platform.solid) this.queue = [ctrl(), ctrl(0, 1)];
  }

  /** Se déplacer vers le but sans sauter dans le vide. */
  private walk(m: Match, f: Fighter): Controls {
    if (this.goalX === null) return NEUTRAL;
    const p = m.stage.main;
    const safe = Math.max(p.x + 30, Math.min(p.x + p.w - 30, this.goalX));
    const dx = safe - f.x;
    if (Math.abs(dx) < 30) return NEUTRAL;
    return ctrl(Math.sign(dx), 0);
  }

  private onLedge(f: Fighter): Controls {
    if (f.t === 1) this.ledgeWait = this.rng.int(10, 50 - this.level * 3);
    if (f.t < this.ledgeWait) return NEUTRAL;
    return ledgeOption(this.rng, f);
  }

  private nearGround(m: Match, f: Fighter): boolean {
    return f.vy + f.kby > 0 && !!m.stage.landing(f.x, f.y, f.y + 40, false);
  }
}
