import { describe, expect, it } from 'vitest';
import type { Controls } from '../src/sim/core/input';
import { makeMatch, player, skipCountdown } from './helpers';

const DOWN: Controls = { x: 0, y: 1, cx: 0, cy: 0, buttons: 0 };

/** Une IA contre un joueur qui ne bouge pas (il redescend tout de suite après une éjection). */
function versusIdle(level: number) {
  const m = makeMatch([player(0, 'jbg', 0), player(1, 'mat', level)], { stocks: 99, items: 'off' });
  skipCountdown(m);
  const frames = 60 * 60;
  let hits = 0;
  let reversals = 0;
  let lastDir = 0;
  let overlap = 0;
  for (let i = 0; i < frames; i++) {
    const human = m.fighters[0]!;
    m.step([human.state === 'respawn' ? DOWN : undefined]);
    for (const e of m.drainEvents()) if (e.type === 'hit' && e.victim === 0) hits++;
    const ai = m.fighters[1]!;
    if (ai.grounded && Math.abs(ai.vx) > 1) {
      const d = Math.sign(ai.vx);
      if (lastDir && d !== lastDir) reversals++;
      lastDir = d;
    }
    if (human.alive && Math.abs(ai.x - human.x) < 12 && Math.abs(ai.y - human.y) < 10) overlap++;
  }
  return { hits, reversals, overlap: overlap / frames };
}

describe("comportement de l'IA", () => {
  const low = versusIdle(1);
  const high = versusIdle(9);

  it('ne fait pas d’allers-retours gauche-droite', () => {
    expect(low.reversals).toBeLessThan(60);
    expect(high.reversals).toBeLessThan(60);
  });

  it('ne se superpose pas au joueur', () => {
    expect(high.overlap).toBeLessThan(0.03);
  });

  it('attaque vraiment, et plus fort quand le niveau monte', () => {
    expect(low.hits).toBeGreaterThan(2);
    expect(high.hits).toBeGreaterThan(low.hits * 2);
  });
});
