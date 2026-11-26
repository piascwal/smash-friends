/* Le rendu d'un combat : décor, plateformes, objets, combattants, projectiles, particules, puis HUD et
   effets plein écran. Il lit le match, il ne le modifie jamais. */
import type { MatchAssets } from '../assets/match-assets';
import type { GameEvent } from '../sim/match/events';
import type { Match } from '../sim/match/match';
import { drawBackdrop } from './backdrop';
import { Camera } from './camera';
import { CPU_COLOR, SLOT_COLORS, TEAM_COLORS } from './colors';
import { newAnim } from './fighter-look';
import { drawFighter, type FighterView } from './fighters-draw';
import { Effects } from './fx/effects';
import { drawHud } from './hud';
import { drawItem, drawProjectile } from './objects-draw';
import { drawOverlay } from './overlay';
import { drawPlatforms } from './platforms';

export class Renderer {
  readonly camera = new Camera();
  readonly effects: Effects;
  readonly views: FighterView[];
  private readonly ctx: CanvasRenderingContext2D;
  private time = 0;
  private W = 1280;
  private H = 720;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly match: Match,
    private readonly assets: MatchAssets,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    const cfg = match.config;
    this.views = match.fighters.map((f) => {
      const p = cfg.players.find((pl) => pl.slot === f.slot)!;
      const color = cfg.teams ? TEAM_COLORS[p.team % 4]! : SLOT_COLORS[f.slot % 4]!;
      return {
        f,
        assets: assets.fighters.get(f.slot)!,
        color,
        tag: p.cpu > 0 ? `CPU ${p.cpu}` : p.name,
        anim: newAnim(),
      };
    });
    this.effects = new Effects(
      this.camera,
      (slot) => this.views.find((v) => v.f.slot === slot)?.color ?? CPU_COLOR,
    );
    this.camera.update(match, this.W, this.H);
  }

  resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Une image de jeu simulée : effets des événements, animations. */
  tick(events: readonly GameEvent[]): void {
    this.time++;
    this.effects.handle(events, this.match);
    for (const e of events) {
      if (e.type === 'jump' && e.air) {
        const v = this.views.find((x) => x.f.slot === e.who);
        if (v) v.anim.flipTimer = 16;
      }
    }
    for (const v of this.views) this.animate(v);
    this.ambient();
    this.effects.update();
  }

  private animate(v: FighterView): void {
    const a = v.anim;
    if (a.flipTimer > 0) a.flipTimer--;
    if (a.hitFlash > 0) a.hitFlash--;
    const dmg = v.f.percent - a.lastPercent;
    if (dmg > 0.5) {
      a.hudShake = Math.min(14, 4 + dmg);
      a.hudPop = Math.min(1, dmg / 15);
      a.hitFlash = 3;
    }
    a.lastPercent = v.f.percent;
    a.hudShake *= 0.85;
    a.hudPop *= 0.85;
  }

  /** Effets continus : fumée d'éjection, étincelles de charge, flammes. */
  private ambient(): void {
    const P = this.effects.particles;
    for (const v of this.views) {
      const f = v.f;
      if (!f.alive) continue;
      const speed = Math.hypot(f.kbx, f.kby);
      if (speed > 6 && f.hitlag === 0) {
        P.add({
          kind: 'smoke',
          x: f.cx,
          y: f.cy,
          vx: -f.kbx * 0.05,
          vy: -f.kby * 0.05,
          size: 6 + speed * 0.6,
          grow: 0.6,
          life: 30,
          color: speed > 20 ? '#ffffff' : '#bbbbbb',
        });
        if (speed > 18)
          P.add({
            kind: 'line',
            x: f.cx,
            y: f.cy,
            vx: f.kbx * 0.4,
            vy: f.kby * 0.4,
            size: 4,
            life: 10,
            color: v.color,
          });
      }
      if (f.move?.charging && this.time % 3 === 0) {
        const a = Math.random() * Math.PI * 2;
        P.add({
          kind: 'glow',
          x: f.cx + Math.cos(a) * 70,
          y: f.cy + Math.sin(a) * 70,
          vx: -Math.cos(a) * 4,
          vy: -Math.sin(a) * 4,
          size: 5,
          life: 16,
          color: '#ffe23f',
        });
      }
      if (f.move?.def.fx?.trail === 'feu' && f.move.frame > 3 && f.move.frame < 30) {
        P.add({
          kind: 'flame',
          x: f.cx + (Math.random() - 0.5) * 30,
          y: f.cy,
          vy: 1.5,
          size: 12,
          life: 18,
          color: '#ff7a1a',
        });
      }
      if (f.starPower > 0 && this.time % 4 === 0) {
        P.add({
          kind: 'star',
          x: f.cx + (Math.random() - 0.5) * 60,
          y: f.cy + (Math.random() - 0.5) * 90,
          size: 6,
          life: 20,
          color: `hsl(${(this.time * 12) % 360},100%,65%)`,
        });
      }
    }
  }

  draw(): void {
    const { ctx, W, H, match: m } = this;
    this.camera.update(m, W, H);
    drawBackdrop(ctx, this.assets.backdrop, m.stage.def, this.camera, W, H);
    ctx.save();
    this.camera.apply(ctx, W, H);
    drawPlatforms(ctx, m.stage.platforms, m.stage.def.theme, this.time);
    for (const it of m.items) if (it.holder < 0) drawItem(ctx, it, this.assets, this.time);
    for (const v of this.views) {
      drawFighter(ctx, v, this.time, this.camera.zoom);
      if (v.f.item && v.f.alive) drawItem(ctx, v.f.item, this.assets, this.time);
    }
    for (const p of m.projectiles) drawProjectile(ctx, p, this.assets, this.time);
    this.effects.particles.draw(ctx);
    ctx.restore();
    drawOverlay(ctx, this.effects, this.camera, W, H);
    drawHud(ctx, m, this.views, this.camera, W, H);
  }
}
