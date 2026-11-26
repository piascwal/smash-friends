/* Apparition des objets au fil du combat, selon la fréquence choisie dans les règles. */
import type { World } from '../world';
import { ITEM_LIST } from './catalog';
import { Item } from './item';

export type ItemFrequency = 'off' | 'low' | 'mid' | 'high';

/** Intervalle moyen entre deux apparitions (images). */
const INTERVAL: Record<ItemFrequency, number> = { off: 0, low: 1200, mid: 660, high: 330 };
const MAX_ON_STAGE = 4;

export class ItemSpawner {
  private next: number;

  constructor(
    private readonly freq: ItemFrequency,
    w: Pick<World, 'rng'>,
  ) {
    this.next = this.delay(w);
  }

  private delay(w: Pick<World, 'rng'>): number {
    const base = INTERVAL[this.freq];
    return Math.round(base * w.rng.range(0.6, 1.4));
  }

  update(w: World): void {
    if (this.freq === 'off') return;
    if (--this.next > 0) return;
    this.next = this.delay(w);
    if (w.items.length >= MAX_ON_STAGE) return;
    const plats = w.stage.platforms;
    const p = w.rng.pick(plats);
    const x = w.rng.range(p.x + 30, p.x + p.w - 30);
    const def = w.rng.weighted(ITEM_LIST.map((d) => ({ item: d, weight: d.weight })));
    w.items.push(new Item(def, x, p.y - 260));
    w.emit({ type: 'item', what: 'spawn', x, y: p.y - 260 });
  }
}
