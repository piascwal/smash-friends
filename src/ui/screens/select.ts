/* Sélection des combattants : grille des personnages, quatre emplacements (joueur, CPU de niveau 1 à 9,
   ou fermé), équipes, règles. Une manette qui appuie sur A rejoint la partie. */
import type { Screen } from '../../app/screen';
import { ready, saveSetup, type Setup, type SlotSetup } from '../../app/setup';
import { characterIds, characterInfo, portraitUrl } from '../../assets/loader';
import { sfx } from '../../audio/sfx';
import { availableDevices } from '../../input/devices';
import type { NavAction } from '../../input/device';
import { fighterDef } from '../../sim/roster/characters';
import { h } from '../dom';
import { focusFirst } from '../nav';
import { rulesPanel, rulesSummary } from '../rules-panel';
import { slotCard, slotColor, type SlotCallbacks } from '../slot-card';

export interface SelectActions {
  next(): void;
  back(): void;
}

const KINDS: SlotSetup['kind'][] = ['human', 'cpu', 'off'];
const RANDOM_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="5" y="8" font-size="8" text-anchor="middle" fill="white">?</text></svg>';

export class SelectScreen implements Screen {
  readonly el: HTMLElement;
  private active: number;
  private readonly grid = h('div.char-grid');
  private readonly slots = h('div.slots');
  private readonly summary = h('button.rules-btn', { 'data-nav': true, onclick: () => this.openRules() });
  private readonly go = h('button.ready-banner', { onclick: () => this.tryNext() }, 'PRÊT AU COMBAT !  ▶');

  constructor(
    private readonly setup: Setup,
    private readonly actions: SelectActions,
  ) {
    const i = setup.slots.findIndex((s) => s.kind === 'human' && !s.charId);
    this.active = Math.max(0, i);
    this.el = h(
      'div.screen.select-screen',
      {},
      h(
        'div.select-head',
        {},
        h('button.back', { 'data-nav': true, onclick: () => actions.back() }, '◀'),
        h('h1', {}, 'CHOISIS TON COMBATTANT'),
        this.summary,
      ),
      this.grid,
      this.slots,
      this.go,
    );
    void this.buildGrid();
    this.changed();
  }

  private changed(): void {
    saveSetup(this.setup);
    this.renderSlots();
    this.renderBadges();
    this.go.classList.toggle('on', ready(this.setup));
    this.summary.textContent = rulesSummary(this.setup.rules);
  }

  private assign(slot: number, charId: string): void {
    const s = this.setup.slots[slot]!;
    if (s.kind === 'off') s.kind = 'cpu';
    s.charId = charId;
    sfx.menuOk();
    const next = this.setup.slots.findIndex((x) => x.kind !== 'off' && !x.charId);
    if (next >= 0) this.active = next;
    this.changed();
  }

  private callbacks(s: SlotSetup, i: number): SlotCallbacks {
    return {
      cycleKind: () => {
        s.kind = KINDS[(KINDS.indexOf(s.kind) + 1) % 3]!;
        if (s.kind !== 'off') this.active = i;
        sfx.menuMove();
        this.changed();
      },
      level: (d) => {
        s.cpu = Math.max(1, Math.min(9, s.cpu + d));
        sfx.menuMove();
        this.changed();
      },
      cycleTeam: () => {
        s.team = (s.team + 1) % 3;
        this.changed();
      },
      cycleDevice: () => {
        const ids = availableDevices().map((d) => d.id);
        s.device = ids[(ids.indexOf(s.device) + 1) % ids.length] ?? 'clavier';
        this.changed();
      },
      select: () => {
        if (s.kind === 'off') s.kind = 'cpu';
        this.active = i;
        this.changed();
      },
    };
  }

  private renderSlots(): void {
    const teams = this.setup.rules.teams;
    this.slots.replaceChildren(
      ...this.setup.slots.map((s, i) => slotCard(i, s, teams, i === this.active, this.callbacks(s, i))),
    );
  }

  private renderBadges(): void {
    const teams = this.setup.rules.teams;
    for (const tile of this.grid.querySelectorAll<HTMLElement>('.char-tile')) {
      const picked = this.setup.slots
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.kind !== 'off' && s.charId === tile.dataset.char);
      tile
        .querySelector('.badges')!
        .replaceChildren(
          ...picked.map(({ s, i }) =>
            h(
              'span.badge',
              { style: `--c:${slotColor(i, s, teams)}` },
              s.kind === 'cpu' ? 'CPU' : `J${i + 1}`,
            ),
          ),
        );
    }
  }

  private tile(id: string, name: string, img: string, color: string): HTMLElement {
    return h(
      'button.char-tile',
      {
        'data-nav': true,
        'data-char': id,
        style: `--c:${color}`,
        onclick: () => this.assign(this.active, id),
      },
      h('img', { src: img, alt: name, loading: 'lazy' }),
      h('span.char-name', {}, name),
      h('span.badges'),
    );
  }

  private async buildGrid(): Promise<void> {
    const ids = await characterIds();
    const infos = await Promise.all(ids.map((id) => characterInfo(id)));
    this.grid.replaceChildren(
      ...infos.map((i) => this.tile(i.id, i.name, portraitUrl(i), i.color)),
      this.tile('random', 'HASARD', RANDOM_IMG, '#555'),
    );
    for (const i of infos)
      this.grid.querySelector(`[data-char="${i.id}"]`)?.setAttribute('title', fighterDef(i.id).archetype);
    this.renderBadges();
    focusFirst(this.el);
  }

  private openRules(): void {
    const panel = rulesPanel(
      this.setup.rules,
      () => this.changed(),
      () => {
        panel.remove();
        this.summary.focus();
      },
    );
    this.el.append(panel);
    focusFirst(panel);
  }

  private tryNext(): void {
    if (ready(this.setup)) {
      sfx.menuOk();
      this.actions.next();
    } else sfx.menuBack();
  }

  /** Emplacement du périphérique qui appuie ; une manette inconnue rejoint la partie. */
  private slotOf(from: string): number {
    const slots = this.setup.slots;
    const mine = slots.findIndex(
      (s) =>
        s.kind === 'human' && (s.device === from || (s.device === 'clavier' && from.startsWith('clavier'))),
    );
    if (mine >= 0) return mine;
    if (!from.startsWith('manette')) return this.active;
    let j = slots.findIndex((s) => s.kind === 'off');
    if (j < 0) j = slots.findIndex((s) => s.kind === 'cpu');
    if (j < 0) return this.active;
    Object.assign(slots[j]!, { kind: 'human', device: from, charId: null });
    return j;
  }

  back(): void {
    const modal = this.el.querySelector<HTMLElement>('.modal');
    if (modal) modal.remove();
    else this.actions.back();
  }

  nav(a: NavAction, from: string): boolean {
    if (a === 'start') {
      this.tryNext();
      return true;
    }
    if (a === 'next' || a === 'prev') {
      this.openRules();
      return true;
    }
    const focused = document.activeElement as HTMLElement | null;
    if (a === 'ok' && focused?.dataset.char && !this.el.querySelector('.modal')) {
      this.assign(this.slotOf(from), focused.dataset.char);
      return true;
    }
    return false;
  }
}
