/* L'écran de combat : boucle à 60 images par seconde (pas fixe), commandes des joueurs, rendu,
   ralenti du coup fatal, pause, puis passage aux résultats. */
import type { MatchAssets } from '../assets/match-assets';
import { announce } from '../audio/sfx';
import type { Device, NavAction } from '../input/device';
import { touch } from '../input/devices';
import { Renderer } from '../render/renderer';
import { CpuBrain } from '../sim/ai/brain';
import { NEUTRAL, held, type Controls } from '../sim/core/input';
import type { MatchConfig } from '../sim/match/config';
import type { GameEvent } from '../sim/match/events';
import { Match } from '../sim/match/match';
import { h } from '../ui/dom';
import { focusFirst } from '../ui/nav';
import { prefs } from './prefs';
import type { Screen } from './screen';

const STEP = 1000 / 60;
const GAME_OVER_DELAY = 170;

export interface MatchCallbacks {
  finished(m: Match): void;
  quit(): void;
}

function speak(events: readonly GameEvent[]): void {
  if (!prefs.voice) return;
  for (const e of events) {
    if (e.type === 'countdown') announce(String(e.n));
    if (e.type === 'go') announce('Partez !');
    if (e.type === 'game') announce('Terminé !');
    if (e.type === 'suddenDeath') announce('Mort subite !');
  }
}

/** Les cerveaux des IA, rangés par emplacement. */
export function brainsFor(config: MatchConfig): (CpuBrain | null)[] {
  const out: (CpuBrain | null)[] = [];
  for (const p of config.players)
    out[p.slot] = p.cpu > 0 ? new CpuBrain(p.cpu, config.seed + p.slot * 7919) : null;
  return out;
}

export class MatchScreen implements Screen {
  readonly el = h('div.screen.match-screen');
  readonly match: Match;
  readonly renderer: Renderer;
  private paused = false;
  private last = performance.now();
  private acc = 0;
  private overFrames = 0;
  private pauseWasDown = false;
  private readonly pauseEl: HTMLElement;
  private readonly onResize = () => this.renderer.resize();

  constructor(
    canvas: HTMLCanvasElement,
    config: MatchConfig,
    assets: MatchAssets,
    private readonly devices: Map<number, Device>,
    private readonly cb: MatchCallbacks,
  ) {
    this.match = new Match(config, brainsFor(config));
    this.renderer = new Renderer(canvas, this.match, assets);
    this.renderer.resize();
    this.renderer.camera.shakeScale = prefs.shake ? 1 : 0;
    window.addEventListener('resize', this.onResize);
    if ([...devices.values()].includes(touch)) touch.show(this.el);
    this.pauseEl = h(
      'div.modal.pause',
      {},
      h(
        'div.panel',
        {},
        h('h2', {}, 'PAUSE'),
        h('button.btn', { 'data-nav': true, onclick: () => this.setPause(false) }, 'REPRENDRE'),
        h('button.btn', { 'data-nav': true, onclick: () => cb.quit() }, 'ABANDONNER'),
      ),
    );
  }

  private setPause(p: boolean): void {
    this.paused = p;
    if (p) {
      this.el.append(this.pauseEl);
      focusFirst(this.pauseEl);
    } else this.pauseEl.remove();
  }

  private inputs(): Controls[] {
    const out: Controls[] = [];
    let pause = false;
    for (const [slot, d] of this.devices) {
      const c = d.read();
      out[slot] = c;
      if (held(c, 'pause')) pause = true;
    }
    if (pause && !this.pauseWasDown && this.match.phase === 'fight') this.setPause(!this.paused);
    this.pauseWasDown = pause;
    return out;
  }

  private step(): void {
    const ins = this.inputs();
    if (this.paused) return;
    this.match.step(ins.map((c) => c ?? NEUTRAL));
    const events = this.match.drainEvents();
    speak(events);
    this.renderer.tick(events);
    if (!prefs.cinematic) this.renderer.effects.cinematic = 0;
    if (this.match.phase === 'gameover' && ++this.overFrames === GAME_OVER_DELAY)
      this.cb.finished(this.match);
  }

  frame(now: number): void {
    const dt = Math.min(100, now - this.last);
    this.last = now;
    const scale = this.match.phase === 'gameover' ? 0.5 : this.renderer.effects.timeScale();
    this.acc += dt * (this.paused ? 1 : scale);
    if (scale === 0 && !this.paused) {
      // arrêt sur image du coup fatal : seuls les effets avancent
      this.renderer.effects.update();
      this.acc = 0;
    }
    let n = 0;
    while (this.acc >= STEP && n++ < 4) {
      this.acc -= STEP;
      this.step();
    }
    this.renderer.draw();
  }

  nav(a: NavAction): boolean {
    if (!this.paused && (a === 'start' || a === 'back') && this.match.phase === 'fight') {
      this.setPause(true);
      return true;
    }
    if (this.paused && a === 'back') {
      this.setPause(false);
      return true;
    }
    return !this.paused;
  }

  leave(): void {
    window.removeEventListener('resize', this.onResize);
    touch.hide();
  }
}
