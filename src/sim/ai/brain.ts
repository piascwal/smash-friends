/* Le cerveau d'un combattant IA, niveau 1 à 9. Il poursuit une intention quelque temps (approcher,
   attendre, reculer, tirer de loin, sauter sur l'adversaire, garder le bord, prendre un objet) et
   saisit les occasions : frapper à portée, punir une erreur, se protéger d'un coup qui arrive.
   Le niveau règle le temps de réaction, l'agressivité, la défense et la précision (voir profile.ts). */
import { BUTTONS, NEUTRAL, type Controls } from '../core/input';
import { Rng } from '../core/rng';
import type { Fighter } from '../fighter/fighter';
import type { Brain, Match } from '../match/match';
import { attackInRange, defend, jumpIn } from './attacks';
import { climb, ctrl, tap } from './inputs';
import { useItem, wantsItem } from './items';
import { Mover } from './movement';
import { profileFor, type Profile } from './profile';
import { ledgeOption, recover, survivalDI } from './recovery';
import { hasProjectile, offstage, pickTarget, roomAhead, threatened, vulnerable } from './senses';

type Intent = 'approach' | 'wait' | 'retreat' | 'zone' | 'jumpIn' | 'edgeguard' | 'item';

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
  private readonly p: Profile;
  private readonly rng: Rng;
  private readonly mover = new Mover();
  private queue: Controls[] = [];
  private last: Controls = NEUTRAL;
  private intent: Intent = 'approach';
  private intentUntil = 0;
  /** Prochaine image où l'IA peut saisir une occasion (temps de réaction). */
  private nextLook = 0;
  /** Image depuis laquelle un coup ennemi est perçu (on réagit après le temps de réaction). */
  private threatSince = -1;
  private threatHandled = false;
  private target: Fighter | null = null;
  /** Point de repli, fixé au moment de décider de reculer. */
  private retreatX = 0;
  private ledgeWait = 0;

  constructor(
    readonly level: number,
    seed: number,
  ) {
    this.p = profileFor(level);
    this.rng = new Rng(seed);
  }

  think(m: Match, f: Fighter): Controls {
    const out = this.decide(m, f);
    // un spécial tenu deux images de suite est relâché : chaque spécial est un nouvel appui
    const pressed = out.buttons & this.last.buttons & BUTTONS.special;
    const c = pressed ? { ...out, buttons: out.buttons & ~pressed } : out;
    this.last = c;
    return c;
  }

  private decide(m: Match, f: Fighter): Controls {
    if (m.phase !== 'fight') return NEUTRAL;
    const special = this.special(m, f);
    if (special) return special;
    if (this.queue.length) return this.queue.shift()!;
    if (BUSY.has(f.state) || f.hitstun > 0 || f.state === 'shield') return NEUTRAL;
    this.target = pickTarget(m, f, this.target);
    const t = this.target;
    if (!t) return this.mover.to(m, f, 0, 40);
    const act = this.react(m, f, t);
    if (act) {
      this.mover.stop();
      this.queue = act;
      return this.queue.shift()!;
    }
    if (m.frame >= this.intentUntil) this.chooseIntent(m, f, t);
    return this.follow(m, f, t);
  }

  /** Situations où l'on ne choisit pas : éjecté, étourdi, de retour, au rebord, hors du stage. */
  private special(m: Match, f: Fighter): Controls | null {
    if (f.hitlag > 0 && f.pendingLaunch) return this.rng.chance(this.p.di) ? survivalDI(f) : NEUTRAL;
    if (f.state === 'dizzy') return ctrl(m.frame % 2 ? 1 : -1, 0, m.frame % 2 ? ['attack'] : ['jump']);
    if (f.state === 'respawn') return f.t > 45 + this.p.reaction ? ctrl(f.x < 0 ? 1 : -1, 0) : NEUTRAL;
    if (f.state === 'ledge') return this.onLedge(f);
    if ((f.state === 'tumble' || f.state === 'hitstun') && this.nearGround(m, f))
      return this.rng.chance(this.p.tech) ? ctrl(this.rng.int(-1, 1), 0, ['shield']) : NEUTRAL;
    if (offstage(m, f)) {
      this.queue = [];
      return recover(m, f, this.rng, this.p.recovery);
    }
    return null;
  }

  /** Les occasions, perçues après le temps de réaction : se protéger, punir, frapper, enchaîner. */
  private react(m: Match, f: Fighter, t: Fighter): Controls[] | null {
    if (threatened(m, f)) {
      if (this.threatSince < 0) this.threatSince = m.frame;
      if (!this.threatHandled && m.frame - this.threatSince >= this.p.guardReaction) {
        this.threatHandled = true;
        if (this.rng.chance(this.p.defense)) return defend(f, this.rng, this.p);
      }
    } else {
      this.threatSince = -1;
      this.threatHandled = false;
    }
    if (m.frame < this.nextLook) return null;
    this.nextLook = m.frame + this.p.reaction + this.rng.int(0, this.p.reaction);
    if (f.item) {
      const use = useItem(f, t, this.rng);
      if (use) return use;
    }
    const chance = vulnerable(t) ? this.p.punish : this.p.aggression;
    if (!this.rng.chance(chance)) return null;
    const attack = attackInRange(f, t, this.rng, this.p);
    if (attack) return attack;
    if (this.p.combo && t.hitstun > 0 && !t.grounded && Math.abs(t.x - f.x) < 140 && t.cy < f.cy - 40)
      return [ctrl(0, 0, ['jump']), ctrl(), ctrl(), ctrl(), ...tap(0, -1, 'attack')];
    return null;
  }

  private chooseIntent(m: Match, f: Fighter, t: Fighter): void {
    const r = this.rng;
    const dist = Math.abs(t.x - f.x);
    let intent: Intent;
    if (this.p.edgeguard && offstage(m, t) && t.hitstun <= 0) intent = 'edgeguard';
    else if (t.hitstun > 0 && r.chance(this.p.aggression)) intent = 'approach';
    else if (!f.item && wantsItem(m, f, this.level, r)) intent = 'item';
    else {
      const a = this.p.aggression;
      intent = r.weighted<Intent>([
        { item: 'approach', weight: a },
        { item: 'jumpIn', weight: dist > 90 && dist < 280 ? a * 0.5 : 0 },
        { item: 'zone', weight: hasProjectile(f) && dist > 220 ? this.p.zoning : 0 },
        { item: 'wait', weight: (1 - a) * 0.7 },
        { item: 'retreat', weight: f.percent > t.percent + 40 ? 0.2 : 0.04 },
      ]);
    }
    if (intent === 'retreat') {
      const away = t.x < f.x ? 1 : -1;
      this.retreatX = f.x + away * Math.min(160, roomAhead(m, f, away) - 80);
    }
    this.intent = intent;
    // un niveau agressif n'attend pas longtemps
    const long = intent === 'wait' ? 20 + 70 * (1 - this.p.aggression) : 70;
    this.intentUntil = m.frame + r.int(15, Math.round(long));
  }

  /** Poursuit l'intention courante. */
  private follow(m: Match, f: Fighter, t: Fighter): Controls {
    const side = t.x < f.x ? -1 : 1;
    // distance de frappe : assez près pour que le jab touche (les corps se repoussent en dessous)
    const range = 26 * f.size + t.width / 2;
    switch (this.intent) {
      case 'approach':
        if (t.grounded && t.y < f.y - 90 && Math.abs(t.x - f.x) < 220 && f.grounded)
          return this.burst(climb(Math.sign(t.x - f.x)));
        if (t.cy > f.cy + 80 && f.platform && !f.platform.solid)
          return this.burst([ctrl(), ctrl(0, 1), ctrl(0, 1)]);
        return this.arrive(m, f, t, t.x - side * range);
      case 'jumpIn':
        if (Math.abs(t.x - f.x) < 260 && Math.abs(t.cy - f.cy) < 90 && f.grounded) {
          this.intent = 'wait';
          return this.burst(jumpIn(f, t, this.rng));
        }
        return this.arrive(m, f, t, t.x - side * 200);
      case 'zone':
        if (Math.abs(t.cy - f.cy) < 60 && f.grounded && f.facing === side && m.frame % 40 === 0)
          return this.burst(tap(0, 0, 'special'));
        return this.arrive(m, f, t, t.x - side * 320);
      case 'retreat':
        return this.arrive(m, f, t, this.retreatX);
      case 'edgeguard':
        return this.edgeguard(m, f, t);
      case 'item': {
        const it = m.items.find((i) => i.holder < 0 && !i.flying && i.spawning <= 0);
        if (!it || f.item) return this.endIntent(m);
        if (Math.abs(it.x - f.x) < 30) return this.burst(tap(0, 0, 'attack'));
        return this.mover.to(m, f, it.x, 20);
      }
      default:
        return this.mover.face(f, t);
    }
  }

  /** Aller à un point puis se tourner vers la cible. */
  private arrive(m: Match, f: Fighter, t: Fighter, x: number): Controls {
    const c = this.mover.to(m, f, x, 8);
    return c === NEUTRAL ? this.mover.face(f, t) : c;
  }

  /** Attendre l'adversaire au bord du stage, et le frapper quand il revient. */
  private edgeguard(m: Match, f: Fighter, t: Fighter): Controls {
    if (!offstage(m, t)) return this.endIntent(m);
    const p = m.stage.main;
    const edge = t.x < p.x + p.w / 2 ? p.x + 50 : p.x + p.w - 50;
    const toward = t.x < f.x ? -1 : 1;
    if (Math.abs(t.x - f.x) < 150 && Math.abs(t.cy - f.cy) < 120 && roomAhead(m, f, toward) < 120)
      return this.burst(attackInRange(f, t, this.rng, this.p) ?? tap(toward, 0, 'attack'));
    return this.mover.to(m, f, edge, 10);
  }

  private burst(c: Controls[]): Controls {
    this.mover.stop();
    this.queue = c;
    return this.queue.shift() ?? NEUTRAL;
  }

  private endIntent(m: Match): Controls {
    this.intentUntil = m.frame;
    return NEUTRAL;
  }

  private onLedge(f: Fighter): Controls {
    if (f.t === 1) this.ledgeWait = this.rng.int(8, 20) + this.p.reaction;
    if (f.t < this.ledgeWait) return NEUTRAL;
    return ledgeOption(this.rng, f);
  }

  private nearGround(m: Match, f: Fighter): boolean {
    return f.vy + f.kby > 0 && !!m.stage.landing(f.x, f.y, f.y + 40, false);
  }
}
