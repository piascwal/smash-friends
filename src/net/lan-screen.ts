/* Le réseau local : chacun son téléphone (ou son ordinateur) sur le même Wi-Fi. Un appareil crée la
   partie (il fait tourner le combat), les autres la rejoignent ; les places libres peuvent être des CPU. */
import { nettoiePseudo } from '@piascwal/lan-kit';
import type { App } from '../app/app';
import { MatchScreen } from '../app/match-screen';
import type { Screen } from '../app/screen';
import { toMatchConfig } from '../app/setup';
import { loadMatchAssets } from '../assets/match-assets';
import type { Device } from '../input/device';
import { gamepad, keyboardAll, touch } from '../input/devices';
import { pads } from '../input/gamepad';
import { isTouchScreen } from '../input/touch';
import type { MatchConfig } from '../sim/match/config';
import type { Match } from '../sim/match/match';
import { STAGES } from '../sim/stage/stages';
import { openCharPicker } from '../ui/char-picker';
import { h } from '../ui/dom';
import { focusFirst } from '../ui/nav';
import { rulesPanel, rulesSummary } from '../ui/rules-panel';
import { resultsScreen } from '../ui/screens/results';
import { LanGuest } from './guest';
import { GuestMatchScreen } from './guest-screen';
import { LanHost } from './host';
import { gameList, slotRow } from './lan-views';
import type { HostMessage, LobbySlot } from './protocol';
import { encodeSnapshot, takeSnapshot } from './snapshot';

const NAME_KEY = 'smash-friends:name';

function localDevice(): Device {
  if (isTouchScreen()) return touch;
  const p = pads()[0];
  return p ? gamepad(p.index) : keyboardAll;
}

function savedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export class LanFlow {
  private host: LanHost | null = null;
  private guest: LanGuest | null = null;
  private name = nettoiePseudo(savedName(), 'JOUEUR');
  private charId = 'jbg';

  constructor(private readonly app: App) {}

  private screen(title: string, ...body: (Node | null)[]): Screen {
    const el = h(
      'div.screen.info-screen.lan-screen',
      {},
      h(
        'div.select-head',
        {},
        h('button.back', { 'data-nav': true, onclick: () => this.quit() }, '◀'),
        h('h1', {}, title),
      ),
      h('div.lan-body', {}, ...body),
    );
    return { el, back: () => this.quit() };
  }

  quit(): void {
    this.host?.close();
    this.guest?.close();
    this.host = this.guest = null;
    this.app.menu();
  }

  home(status = ''): void {
    const input = h('input.lan-input', {
      value: this.name,
      maxlength: 14,
      'data-nav': true,
      'aria-label': 'Ton pseudo',
    }) as HTMLInputElement;
    input.addEventListener('change', () => {
      this.name = nettoiePseudo(input.value, 'JOUEUR');
      input.value = this.name;
      try {
        localStorage.setItem(NAME_KEY, this.name);
      } catch {
        /* rien */
      }
    });
    const list = h('div.lan-list', {}, h('p.lan-hint', {}, 'Recherche des parties sur ce Wi-Fi…'));
    const s = this.screen(
      'RÉSEAU LOCAL',
      h('label.lan-label', {}, 'Pseudo ', input),
      h(
        'button.btn',
        { 'data-nav': true, 'data-autofocus': true, onclick: () => void this.createGame() },
        'CRÉER UNE PARTIE',
      ),
      h('h2.lan-h2', {}, 'Rejoindre'),
      list,
      status ? h('p.lan-error', {}, status) : null,
      h(
        'p.lan-hint',
        {},
        'Tous les appareils doivent être sur le même Wi-Fi (pas un Wi-Fi « invités » qui les isole).',
      ),
    );
    this.app.show(s);
    void this.searchGames(list);
  }

  private async searchGames(list: HTMLElement): Promise<void> {
    try {
      this.guest ??= await LanGuest.search();
    } catch {
      list.replaceChildren(h('p.lan-error', {}, 'Wi-Fi introuvable : vérifie ta connexion.'));
      return;
    }
    const g = this.guest;
    g.onGames = () => list.replaceChildren(gameList([...g.games.values()], (game) => void this.join(game)));
    g.onGames();
  }

  private async createGame(): Promise<void> {
    this.app.show(this.screen('RÉSEAU LOCAL', h('div.loader'), h('p', {}, 'Ouverture de la partie…')));
    try {
      this.guest?.close();
      this.guest = null;
      this.host = await LanHost.create(this.name, this.charId, this.app.setup.rules);
    } catch {
      this.home('Impossible de créer la partie : pas de réseau.');
      return;
    }
    this.host.onChange = () => this.hostLobby();
    this.hostLobby();
  }

  private hostLobby(): void {
    const host = this.host!;
    if (host.playing) return;
    const slots = h(
      'div.lan-slots',
      {},
      ...host.slots.map((s, i) =>
        slotRow(s, i, 0, { pick: (k) => this.pickFor(k), cycle: (k) => this.cycleSlot(k) }),
      ),
    );
    const stage = STAGES.find((x) => x.id === host.stageId);
    const s = this.screen(
      'TA PARTIE',
      slots,
      h(
        'div.lan-actions',
        {},
        h(
          'button.rules-btn',
          { 'data-nav': true, onclick: () => this.openRules() },
          rulesSummary(host.rules),
        ),
        h(
          'button.rules-btn',
          { 'data-nav': true, onclick: () => this.cycleStage() },
          `Stage : ${stage?.name ?? 'Hasard'}`,
        ),
        h(
          'button.btn',
          {
            'data-nav': true,
            'data-autofocus': true,
            disabled: host.playerCount < 2,
            onclick: () => void this.hostStart(),
          },
          'LANCER LE COMBAT',
        ),
      ),
      h('p.lan-hint', {}, 'Les autres appareils ouvrent « Réseau local » et voient ta partie.'),
    );
    this.app.show(s);
  }

  private pickFor(slot: number): void {
    openCharPicker(document.querySelector<HTMLElement>('#ui .screen') ?? document.body, (id) => {
      const host = this.host;
      if (host) {
        host.slots[slot]!.charId = id;
        if (slot === 0) this.charId = id;
        host.changed();
      } else {
        this.charId = id;
        this.guest?.pick(id);
      }
    });
  }

  private cycleSlot(slot: number): void {
    const s = this.host!.slots[slot]!;
    if (s.kind === 'off') Object.assign(s, { kind: 'cpu', cpu: 3 });
    else if (s.cpu < 9) s.cpu += 3;
    else s.kind = 'off';
    this.host!.changed();
  }

  private cycleStage(): void {
    const ids = ['random', ...STAGES.map((x) => x.id)];
    const host = this.host!;
    host.stageId = ids[(ids.indexOf(host.stageId) + 1) % ids.length]!;
    host.changed();
  }

  private openRules(): void {
    const host = this.host!;
    const panel = rulesPanel(
      host.rules,
      () => undefined,
      () => {
        panel.remove();
        host.changed();
      },
    );
    document.querySelector('#ui .screen')?.append(panel);
    focusFirst(panel);
  }

  private configFrom(slots: LobbySlot[], rules: LanHost['rules'], stageId: string): MatchConfig {
    const setup = {
      rules,
      stageId,
      slots: slots.map((s) => ({
        kind: s.kind === 'off' ? ('off' as const) : s.kind === 'cpu' ? ('cpu' as const) : ('human' as const),
        charId: s.charId,
        cpu: s.cpu || 3,
        team: s.team,
        device: s.kind === 'host' && !isTouchScreen() ? 'clavier' : 'manette-0',
      })),
    };
    const config = toMatchConfig(setup);
    config.players.forEach((p) => (p.name = slots[p.slot]!.kind === 'cpu' ? 'CPU' : slots[p.slot]!.name));
    return config;
  }

  private async hostStart(): Promise<void> {
    const host = this.host!;
    const config = this.configFrom(host.slots, host.rules, host.stageId);
    host.start(config);
    const assets = await loadMatchAssets(config);
    const devices = new Map<number, Device>([[0, localDevice()]]);
    const screen = new MatchScreen(
      this.app.canvas,
      config,
      assets,
      devices,
      {
        finished: (m) => this.hostEnd(m, assets),
        quit: () => this.hostEnd(screen.match, assets),
      },
      {
        inputs: () => host.remoteInputs(),
        after: (m, events) => host.broadcast(encodeSnapshot(takeSnapshot(m, events))),
      },
    );
    this.app.show(screen);
  }

  private hostEnd(m: Match, assets: Awaited<ReturnType<typeof loadMatchAssets>>): void {
    this.host?.end();
    const back = () => this.hostLobby();
    this.app.show(resultsScreen(m, assets, { again: back, characters: back, menu: () => this.quit() }));
  }

  private async join(game: Parameters<LanGuest['join']>[0]): Promise<void> {
    const g = this.guest!;
    this.app.show(this.screen('RÉSEAU LOCAL', h('div.loader'), h('p', {}, `Connexion à ${game.nom}…`)));
    try {
      await g.join(game, this.name, this.charId);
    } catch (e) {
      this.home((e as Error).message === 'complet' ? 'Cette partie est complète.' : 'Connexion impossible.');
      return;
    }
    g.onMessage = (msg) => this.guestMessage(msg);
    g.onClosed = () => this.home('La partie a été fermée.');
  }

  private guestMessage(msg: HostMessage): void {
    if (msg.t === 'lobby') return this.guestLobby(msg);
    if (msg.t === 'start') return this.guestStart(msg.config);
    if (msg.t === 'end') return this.guestEnd();
    if (msg.t === 'bye') this.home('L’hôte a fermé la partie.');
  }

  private guestLobby(msg: Extract<HostMessage, { t: 'lobby' }>): void {
    const slots = h(
      'div.lan-slots',
      {},
      ...msg.slots.map((s, i) =>
        slotRow(s, i, msg.you, { pick: (k) => k === msg.you && this.pickFor(k), cycle: null }),
      ),
    );
    this.app.show(
      this.screen('SALON', slots, h('p.lan-hint', {}, `${rulesSummary(msg.rules)} · en attente de l’hôte…`)),
    );
  }

  private guestMatch: GuestMatchScreen | null = null;

  private guestStart(config: MatchConfig): void {
    this.guestMatch = new GuestMatchScreen(this.app.canvas, config, this.guest!, localDevice());
    this.app.show(this.guestMatch);
  }

  private guestEnd(): void {
    const gm = this.guestMatch;
    if (!gm) return;
    void loadMatchAssets(gm.match.config).then((assets) => {
      const wait = () => this.app.show(this.screen('SALON', h('p.lan-hint', {}, 'En attente de l’hôte…')));
      this.app.show(
        resultsScreen(gm.match, assets, { again: wait, characters: wait, menu: () => this.quit() }),
      );
    });
  }
}
