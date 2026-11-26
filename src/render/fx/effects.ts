/* Les effets déclenchés par les événements du combat : étincelles, ondes de choc, tremblements, son,
   explosion d'éjection, cinématique du coup fatal, textes (compte à rebours, GO, GAME). */
import { sfx } from '../../audio/sfx';
import type { BlastSide, GameEvent } from '../../sim/match/events';
import type { Match } from '../../sim/match/match';
import type { Camera } from '../camera';
import { Particles } from './particles';

export interface KoBlast {
  x: number;
  y: number;
  side: BlastSide;
  color: string;
  age: number;
  star: boolean;
  who: number;
}

export interface BigText {
  text: string;
  age: number;
  max: number;
  color: string;
}

const EFFECT_COLORS: Record<string, string> = {
  fire: '#ff8a1f',
  electric: '#8fd8ff',
  ice: '#bff4ff',
  slash: '#ffffff',
  normal: '#fff3a0',
};

export class Effects {
  readonly particles = new Particles();
  readonly blasts: KoBlast[] = [];
  readonly texts: BigText[] = [];
  flash = 0;
  flashColor = '#ffffff';
  /** Coup fatal : images restantes de la cinématique (ralenti), et la victime. */
  cinematic = 0;
  cinematicVictim = -1;

  constructor(
    private readonly camera: Camera,
    private readonly colorOf: (slot: number) => string,
  ) {}

  /** Facteur de vitesse de la simulation (0 : arrêt sur image, < 1 : ralenti). */
  timeScale(): number {
    if (this.cinematic <= 0) return 1;
    return this.cinematic > 26 ? 0 : 0.3;
  }

  text(text: string, max = 60, color = '#ffffff'): void {
    this.texts.push({ text, age: 0, max, color });
  }

  handle(events: readonly GameEvent[], m: Match): void {
    for (const e of events) this.one(e, m);
  }

  private one(e: GameEvent, m: Match): void {
    const P = this.particles;
    switch (e.type) {
      case 'hit':
        return this.hit(e, m);
      case 'shield':
        P.add({ kind: 'ring', x: e.x, y: e.y, size: 10, grow: 3, life: 12, color: '#9fe8ff' });
        P.burst(e.x, e.y, 5, 6, '#bff4ff');
        sfx.shield();
        return;
      case 'shieldBreak':
        P.burst(e.x, e.y, 24, 12, '#9fe8ff', 'shard', 40);
        this.flash = 0.6;
        this.camera.addShake(14);
        sfx.shieldBreak();
        return;
      case 'ko':
        return this.ko(e);
      case 'jump':
        if (e.air)
          P.add({
            kind: 'ring',
            x: e.x,
            y: e.y,
            size: 8,
            grow: 2.2,
            life: 14,
            color: 'rgba(255,255,255,0.8)',
          });
        else this.dust(e.x, e.y, 4);
        sfx.jump(e.air);
        return;
      case 'land':
        this.dust(e.x, e.y, e.hard ? 9 : 4);
        if (e.hard) this.camera.addShake(3);
        sfx.land(e.hard);
        return;
      case 'dash':
        for (let i = 0; i < 4; i++)
          P.add({
            kind: 'dust',
            x: e.x - e.dir * 20,
            y: e.y - 6,
            vx: -e.dir * (2 + i),
            vy: -1 - Math.random(),
            size: 7,
            grow: 0.5,
            life: 22,
            color: '#e8e0d0',
          });
        sfx.dash();
        return;
      case 'move':
        sfx.whoosh(e.smash || e.sfx === 'heavy' || e.sfx === 'smash');
        return;
      case 'charge':
        sfx.charge();
        return;
      default:
        return this.misc(e);
    }
  }

  private misc(e: GameEvent): void {
    const P = this.particles;
    switch (e.type) {
      case 'tech':
        P.add({ kind: 'star', x: e.x, y: e.y - 30, size: 26, life: 14, color: '#ffffff' });
        sfx.tech();
        return;
      case 'ledge':
        P.burst(e.x, e.y, 6, 3, '#ffffff', 'spark', 10);
        return;
      case 'counter':
        this.flash = 0.5;
        P.add({ kind: 'ring', x: e.x, y: e.y, size: 20, grow: 6, life: 16, color: '#bff4ff' });
        sfx.counter();
        return;
      case 'reflect':
        P.add({ kind: 'ring', x: e.x, y: e.y, size: 16, grow: 4, life: 14, color: '#7af5ff' });
        sfx.counter();
        return;
      case 'explosion':
        this.explosion(e.x, e.y, e.r);
        return;
      case 'item':
        return this.item(e.what, e.x, e.y);
      case 'respawn':
        return;
      case 'countdown':
        this.text(String(e.n), 50);
        sfx.countdown(e.n);
        return;
      case 'go':
        this.text('GO !', 70, '#ffd23f');
        sfx.countdown(0);
        return;
      case 'game':
        this.text('GAME !', 150, '#ffffff');
        this.flash = 0.8;
        sfx.game();
        return;
      case 'suddenDeath':
        this.text('MORT SUBITE', 120, '#ff4a3a');
        return;
    }
  }

  private hit(e: Extract<GameEvent, { type: 'hit' }>, m: Match): void {
    const P = this.particles;
    const strong = Math.min(1, e.kb / 140);
    const color = EFFECT_COLORS[e.effect] ?? EFFECT_COLORS.normal!;
    P.burst(e.x, e.y, 6 + Math.round(strong * 10), 5 + strong * 9, color);
    P.add({ kind: 'star', x: e.x, y: e.y, size: 12 + strong * 22, life: 8, color: '#ffffff' });
    P.add({ kind: 'ring', x: e.x, y: e.y, size: 8, grow: 2 + strong * 5, life: 12, color: '#ffffff' });
    if (strong > 0.6) {
      P.add({ kind: 'ring', x: e.x, y: e.y, size: 14, grow: 7, life: 18, color: this.colorOf(e.attacker) });
      const a = (-e.angle * Math.PI) / 180;
      for (let i = 0; i < 6; i++) {
        const sp = 14 + Math.random() * 10;
        P.add({
          kind: 'line',
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * sp + (Math.random() - 0.5) * 4,
          vy: Math.sin(a) * sp + (Math.random() - 0.5) * 4,
          size: 3,
          life: 14,
          color: '#ffffff',
        });
      }
    }
    if (e.effect === 'fire') P.burst(e.x, e.y, 10, 4, '#ff7a1a', 'flame', 24);
    if (e.effect === 'electric')
      for (let i = 0; i < 5; i++)
        P.add({
          kind: 'bolt',
          x: e.x,
          y: e.y,
          rot: Math.random() * 6.3,
          size: 12,
          life: 10,
          color: '#bff0ff',
        });
    if (e.effect === 'ice') P.burst(e.x, e.y, 8, 5, '#dff8ff', 'shard', 26);
    this.camera.addShake(Math.min(16, 2 + e.kb / 12));
    sfx.hit(strong, e.effect);
    if (e.fatal && e.kb > 105 && this.cinematic <= 0) {
      const v = m.fighter(e.victim);
      this.cinematic = 50;
      this.cinematicVictim = e.victim;
      this.flash = 0.7;
      this.flashColor = '#ffffff';
      if (v) this.camera.focus = { x: v.x, y: v.cy, zoom: 1.7, frames: 34 };
      sfx.fatal();
    }
  }

  private ko(e: Extract<GameEvent, { type: 'ko' }>): void {
    this.blasts.push({
      x: e.x,
      y: e.y,
      side: e.side,
      color: this.colorOf(e.who),
      age: 0,
      star: e.star,
      who: e.who,
    });
    if (e.star) {
      sfx.star();
      return;
    }
    this.camera.addShake(24);
    this.flash = 0.45;
    this.flashColor = this.colorOf(e.who);
    sfx.ko();
  }

  private explosion(x: number, y: number, r: number): void {
    const P = this.particles;
    P.burst(x, y, 18, r / 8, '#ffb43a', 'flame', 30);
    P.burst(x, y, 10, r / 14, '#666', 'smoke', 50);
    P.add({ kind: 'ring', x, y, size: r * 0.3, grow: r / 12, life: 16, color: '#fff2a0' });
    this.camera.addShake(r > 60 ? 16 : 6);
    if (r > 60) sfx.explosion();
  }

  private item(what: string, x: number, y: number): void {
    const P = this.particles;
    if (what === 'spawn') P.burst(x, y, 8, 3, '#fff6a0', 'star', 30);
    if (what === 'heal') P.burst(x, y, 10, 3, '#7aff9a', 'glow', 30);
    if (what === 'star') P.burst(x, y, 14, 6, '#ffe23f', 'star', 40);
    if (what === 'break') P.burst(x, y, 12, 6, '#b07a3a', 'shard', 30);
    sfx.item(what);
  }

  dust(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const d = i % 2 ? 1 : -1;
      this.particles.add({
        kind: 'dust',
        x: x + d * 10,
        y: y - 4,
        vx: d * (1 + Math.random() * 3),
        vy: -0.5 - Math.random(),
        size: 6,
        grow: 0.4,
        life: 20,
        color: '#efe6d6',
      });
    }
  }

  update(): void {
    this.particles.update();
    for (const b of this.blasts) b.age++;
    for (let i = this.blasts.length - 1; i >= 0; i--) if (this.blasts[i]!.age > 80) this.blasts.splice(i, 1);
    for (const t of this.texts) t.age++;
    for (let i = this.texts.length - 1; i >= 0; i--)
      if (this.texts[i]!.age > this.texts[i]!.max) this.texts.splice(i, 1);
    this.flash *= 0.88;
    if (this.cinematic > 0) this.cinematic--;
  }
}
