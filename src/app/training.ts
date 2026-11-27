/* Le mode entraînement : on teste un personnage contre un mannequin (immobile, bouclier, saute, marche
   ou IA), avec ralenti, zones de frappe visibles, pourcents réglables, objets à volonté et compteur de
   combos. Vies infinies. */
import { loadMatchAssets } from '../assets/match-assets';
import { characterInfo, portraitUrl } from '../assets/loader';
import { deviceById } from '../input/devices';
import { DUMMY_MODES, DummyBrain } from '../sim/ai/dummy';
import { ITEM_LIST } from '../sim/items/catalog';
import { Item } from '../sim/items/item';
import type { MatchConfig } from '../sim/match/config';
import type { GameEvent } from '../sim/match/events';
import type { Match } from '../sim/match/match';
import { STAGES } from '../sim/stage/stages';
import { openCharPicker } from '../ui/char-picker';
import { h } from '../ui/dom';
import type { App } from './app';
import { MatchScreen } from './match-screen';

interface TrainingChoice {
  me: string;
  dummy: string;
  stageId: string;
}

const KEY = 'smash-friends:training:v1';
const SPEEDS = [1, 0.5, 0.25];

function loadChoice(): TrainingChoice {
  try {
    return {
      me: 'jbg',
      dummy: 'mat',
      stageId: 'vieux-port',
      ...JSON.parse(localStorage.getItem(KEY) ?? '{}'),
    };
  } catch {
    return { me: 'jbg', dummy: 'mat', stageId: 'vieux-port' };
  }
}

function saveChoice(c: TrainingChoice): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* stockage indisponible */
  }
}

export class TrainingFlow {
  private readonly choice = loadChoice();

  constructor(private readonly app: App) {}

  /** Préparation : son personnage, le mannequin, le stage. */
  setup(): void {
    const c = this.choice;
    const card = (label: string, id: string, pick: (v: string) => void) => {
      const img = h('img', { alt: '' });
      const name = h('span.train-name');
      void characterInfo(id).then((i) => {
        img.setAttribute('src', portraitUrl(i));
        name.textContent = i.name;
      });
      return h(
        'button.train-card',
        { 'data-nav': true, onclick: () => openCharPicker(el, (v) => (pick(v), this.setup())) },
        h('span.train-label', {}, label),
        img,
        name,
      );
    };
    const stage = STAGES.find((s) => s.id === c.stageId) ?? STAGES[0]!;
    const el: HTMLElement = h(
      'div.screen.info-screen.train-setup',
      {},
      h(
        'div.select-head',
        {},
        h('button.back', { 'data-nav': true, onclick: () => this.app.menu() }, '◀'),
        h('h1', {}, 'ENTRAÎNEMENT'),
      ),
      h(
        'div.train-cards',
        {},
        card('TOI', c.me, (v) => (c.me = v)),
        card('MANNEQUIN', c.dummy, (v) => (c.dummy = v)),
      ),
      h(
        'div.lan-actions',
        {},
        h('button.rules-btn', { 'data-nav': true, onclick: () => this.nextStage() }, `Stage : ${stage.name}`),
        h(
          'button.btn',
          { 'data-nav': true, 'data-autofocus': true, onclick: () => void this.start() },
          'C’EST PARTI',
        ),
      ),
    );
    this.app.show({ el, back: () => this.app.menu() });
  }

  private nextStage(): void {
    const i = STAGES.findIndex((s) => s.id === this.choice.stageId);
    this.choice.stageId = STAGES[(i + 1) % STAGES.length]!.id;
    this.setup();
  }

  private async start(): Promise<void> {
    saveChoice(this.choice);
    const config: MatchConfig = {
      stageId: this.choice.stageId,
      players: [
        {
          slot: 0,
          charId: this.choice.me,
          team: 0,
          cpu: 0,
          name: 'J1',
          tapJump: !this.device().id.startsWith('clavier'),
        },
        { slot: 1, charId: this.choice.dummy, team: 1, cpu: 0, name: 'MANNEQUIN' },
      ],
      mode: 'stock',
      stocks: 99,
      minutes: 3,
      teams: false,
      friendlyFire: false,
      items: 'off',
      seed: Math.floor(Math.random() * 1e9),
    };
    const assets = await loadMatchAssets(config);
    const dummy = new DummyBrain(config.seed);
    const panel = new TrainingPanel(dummy);
    const screen = new MatchScreen(
      this.app.canvas,
      config,
      assets,
      new Map([[0, this.device()]]),
      { finished: () => this.setup(), quit: () => this.setup() },
      { inputs: () => new Map(), after: (m, events) => panel.after(m, events) },
      [null, dummy],
    );
    panel.attach(screen);
    this.app.show(screen);
  }

  private device() {
    return deviceById(this.app.setup.slots[0]!.device);
  }
}

/** Le panneau de réglages et le compteur de combos, par-dessus le combat. */
class TrainingPanel {
  private match: Match | null = null;
  private combo = 0;
  private comboDamage = 0;
  private readonly comboEl = h('div.train-combo');
  private readonly lastEl = h('div.train-last');

  constructor(private readonly dummy: DummyBrain) {}

  attach(screen: MatchScreen): void {
    this.match = screen.match;
    const cycle = (label: string, values: string[], get: () => number, set: (i: number) => void) => {
      const b = h('button.chip', { 'data-nav': true });
      const paint = () => (b.textContent = `${label} : ${values[get()]}`);
      b.addEventListener('click', () => {
        set((get() + 1) % values.length);
        paint();
      });
      paint();
      return b;
    };
    const modes = DUMMY_MODES.map((d) => d.label);
    let speed = 0;
    const panel = h(
      'div.train-panel',
      {},
      cycle(
        'Mannequin',
        modes,
        () => DUMMY_MODES.findIndex((d) => d.mode === this.dummy.mode),
        (i) => (this.dummy.mode = DUMMY_MODES[i]!.mode),
      ),
      cycle(
        'Vitesse',
        SPEEDS.map((s) => (s === 1 ? 'normale' : `x${s}`)),
        () => speed,
        (i) => (screen.speed = SPEEDS[(speed = i)]!),
      ),
      cycle(
        'Zones de frappe',
        ['cachées', 'visibles'],
        () => (screen.renderer.showHitboxes ? 1 : 0),
        (i) => (screen.renderer.showHitboxes = i === 1),
      ),
      h(
        'div.train-row',
        {},
        h('span', {}, 'Pourcents'),
        this.percentButton('-10', -10),
        this.percentButton('0', 0),
        this.percentButton('+10', 10),
      ),
      h('button.chip', { 'data-nav': true, onclick: () => this.spawnItem() }, 'Faire tomber un objet'),
    );
    screen.el.append(panel, this.comboEl, this.lastEl);
  }

  private percentButton(label: string, delta: number): HTMLElement {
    return h(
      'button.chip',
      {
        'data-nav': true,
        onclick: () => {
          const d = this.match?.fighter(1);
          if (d) d.percent = delta === 0 ? 0 : Math.max(0, Math.min(999, d.percent + delta));
        },
      },
      label,
    );
  }

  private spawnItem(): void {
    const m = this.match;
    const me = m?.fighter(0);
    if (!m || !me) return;
    const def = ITEM_LIST[Math.floor(Math.random() * ITEM_LIST.length)]!;
    m.items.push(new Item(def, me.x + me.facing * 80, me.y - 220));
  }

  /** Après chaque image : compteur de combos (coups enchaînés tant que le mannequin est étourdi). */
  after(m: Match, events: GameEvent[]): void {
    const d = m.fighter(1);
    if (d && d.hitstun <= 0 && d.hitlag <= 0 && this.combo > 0 && d.state !== 'tumble') {
      if (this.combo > 1) this.flashCombo();
      this.combo = 0;
      this.comboDamage = 0;
    }
    for (const e of events) {
      if (e.type !== 'hit' || e.attacker !== 0 || e.victim !== 1) continue;
      this.combo++;
      this.comboDamage += e.damage;
      this.lastEl.textContent = `Dernier coup : ${e.damage} % · éjection ${Math.round(e.kb)}${e.fatal ? ' · ÉJECTE' : ''}`;
      if (this.combo > 1) this.showCombo();
    }
    if (d && d.state === 'respawn') d.percent = 0;
  }

  private showCombo(): void {
    this.comboEl.textContent = `${this.combo} COUPS · ${Math.round(this.comboDamage)} %`;
    this.comboEl.classList.remove('done');
    this.comboEl.classList.add('on');
  }

  private flashCombo(): void {
    this.comboEl.classList.add('done');
    setTimeout(() => this.comboEl.classList.remove('on', 'done'), 1400);
  }
}
