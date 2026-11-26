/* L'application : enchaînement des écrans (titre, menu, sélection, stage, combat, résultats) et
   boucle d'affichage qui distribue la navigation manette/clavier à l'écran courant. */
import { loadMatchAssets, type MatchAssets } from '../assets/match-assets';
import { sfx } from '../audio/sfx';
import { setVolume } from '../audio/synth';
import type { Device, NavAction } from '../input/device';
import { MenuInput, deviceById, keyboardLeft, keyboardRight, keyboardAll } from '../input/devices';
import { isTouchScreen } from '../input/touch';
import type { MatchConfig } from '../sim/match/config';
import type { Match } from '../sim/match/match';
import { h } from '../ui/dom';
import { focusFirst, moveFocus } from '../ui/nav';
import { controlsScreen, optionsScreen } from '../ui/screens/info';
import { menuScreen } from '../ui/screens/menu';
import { resultsScreen } from '../ui/screens/results';
import { SelectScreen } from '../ui/screens/select';
import { stagesScreen } from '../ui/screens/stages';
import { titleScreen } from '../ui/screens/title';
import { MatchScreen } from './match-screen';
import { prefs } from './prefs';
import { enterFullscreen } from './pwa';
import type { Screen } from './screen';
import { loadSetup, saveSetup, toMatchConfig, type Setup } from './setup';

export class App {
  private screen: Screen | null = null;
  private readonly input = new MenuInput();
  readonly setup: Setup;
  private lastConfig: MatchConfig | null = null;

  constructor(
    private readonly ui: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.setup = loadSetup(isTouchScreen());
    setVolume(prefs.volume);
    requestAnimationFrame((t) => this.loop(t));
  }

  show(s: Screen): void {
    this.screen?.leave?.();
    this.screen = s;
    this.ui.replaceChildren(s.el);
    this.canvas.classList.toggle('on', s.el.classList.contains('match-screen'));
    setTimeout(() => focusFirst(s.el));
  }

  private loop(now: number): void {
    this.input.poll((a, from) => this.nav(a, from));
    this.screen?.frame?.(now);
    requestAnimationFrame((t) => this.loop(t));
  }

  private nav(a: NavAction, from: string): void {
    const s = this.screen;
    if (!s) return;
    if (s.nav?.(a, from)) return;
    const root = (s.el.querySelector('.modal') as HTMLElement | null) ?? s.el;
    if (a === 'ok') {
      const el = document.activeElement as HTMLElement | null;
      if (el && root.contains(el)) el.click();
      else focusFirst(root);
    } else if (a === 'back') {
      sfx.menuBack();
      s.back?.();
    } else if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
      sfx.menuMove();
      moveFocus(root, a);
    }
  }

  title(): void {
    this.show(
      titleScreen(() => {
        sfx.menuOk();
        if (isTouchScreen()) void enterFullscreen();
        this.menu();
      }),
    );
  }

  menu(): void {
    this.show(
      menuScreen({
        fight: () => this.select(),
        lan: () => void this.lan(),
        controls: () => this.show(controlsScreen(() => this.menu())),
        options: () => this.show(optionsScreen(() => this.menu())),
        back: () => this.title(),
      }),
    );
  }

  select(): void {
    this.show(new SelectScreen(this.setup, { next: () => this.stages(), back: () => this.menu() }));
  }

  stages(): void {
    this.show(
      stagesScreen(
        this.setup.stageId,
        (id) => {
          this.setup.stageId = id;
          saveSetup(this.setup);
          void this.fight(toMatchConfig(this.setup));
        },
        () => this.select(),
      ),
    );
  }

  /** Périphérique de chaque joueur humain ; deux joueurs au clavier se partagent les deux moitiés. */
  private devicesFor(config: MatchConfig): Map<number, Device> {
    const humans = config.players.filter((p) => p.cpu === 0);
    const map = new Map<number, Device>();
    const kb = humans.filter((p) => this.setup.slots[p.slot]!.device.startsWith('clavier'));
    for (const p of humans) {
      let d = deviceById(this.setup.slots[p.slot]!.device);
      if (kb.length >= 2 && d === keyboardAll) d = kb[0] === p ? keyboardLeft : keyboardRight;
      map.set(p.slot, d);
    }
    return map;
  }

  async fight(config: MatchConfig): Promise<void> {
    this.lastConfig = config;
    this.show({ el: h('div.screen.loading', {}, h('div.loader'), h('p', {}, 'CHARGEMENT…')) });
    const assets: MatchAssets = await loadMatchAssets(config);
    this.show(
      new MatchScreen(this.canvas, config, assets, this.devicesFor(config), {
        finished: (m: Match) => this.results(m, assets),
        quit: () => this.select(),
      }),
    );
  }

  private results(m: Match, assets: MatchAssets): void {
    this.show(
      resultsScreen(m, assets, {
        again: () => void this.fight({ ...this.lastConfig!, seed: Math.floor(Math.random() * 1e9) }),
        characters: () => this.select(),
        menu: () => this.menu(),
      }),
    );
  }

  /** Réseau local : chargé à la demande (le module réseau n'alourdit pas le reste). */
  private async lan(): Promise<void> {
    const { lanScreen } = await import('../net/lan-screen');
    this.show(lanScreen(this));
  }
}
