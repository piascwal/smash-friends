/* L'écran de combat d'un invité : il ne simule rien ; il envoie ses commandes à l'hôte et affiche
   le match miroir mis à jour par les instantanés reçus. */
import { loadMatchAssets } from '../assets/match-assets';
import type { Screen } from '../app/screen';
import type { Device } from '../input/device';
import { touch } from '../input/devices';
import { Renderer } from '../render/renderer';
import { texteLatence } from '@piascwal/lan-kit';
import type { Item } from '../sim/items/item';
import type { MatchConfig } from '../sim/match/config';
import { Match } from '../sim/match/match';
import { h } from '../ui/dom';
import type { LanGuest } from './guest';
import { applySnapshot, type Snapshot } from './snapshot';

export class GuestMatchScreen implements Screen {
  readonly el = h('div.screen.match-screen');
  readonly match: Match;
  private renderer: Renderer | null = null;
  private pending: Snapshot[] = [];
  private readonly items = new Map<number, Item>();
  private readonly ping = h('div.ping');
  private readonly onResize = () => this.renderer?.resize();

  constructor(
    canvas: HTMLCanvasElement,
    config: MatchConfig,
    private readonly guest: LanGuest,
    private readonly device: Device,
  ) {
    this.match = new Match(config);
    this.el.append(this.ping);
    guest.onSnapshot = (s) => this.pending.push(s);
    void loadMatchAssets(config).then((assets) => {
      this.renderer = new Renderer(canvas, this.match, assets);
      this.renderer.resize();
    });
    window.addEventListener('resize', this.onResize);
    if (device === touch) touch.show(this.el);
  }

  frame(): void {
    this.guest.sendControls(this.device.read());
    const r = this.renderer;
    if (!r) return;
    // on rattrape les instantanés arrivés depuis la dernière image (effets et sons de chacun)
    for (const s of this.pending.splice(0)) {
      applySnapshot(this.match, s, this.items);
      r.tick(s.E);
    }
    this.ping.textContent = texteLatence(this.guest.latency);
    r.draw();
  }

  nav(): boolean {
    return true;
  }

  leave(): void {
    window.removeEventListener('resize', this.onResize);
    touch.hide();
  }
}
