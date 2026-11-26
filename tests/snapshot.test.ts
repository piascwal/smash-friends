import { describe, expect, it } from 'vitest';
import { Match } from '../src/sim/match/match';
import type { Item } from '../src/sim/items/item';
import { applySnapshot, decodeSnapshot, encodeSnapshot, takeSnapshot } from '../src/net/snapshot';
import { decodeControls, encodeControls, BUTTONS } from '../src/sim/core/input';
import { makeMatch, player } from './helpers';

describe('réseau : instantanés et commandes', () => {
  it("le match miroir d'un invité reproduit celui de l'hôte", () => {
    const host = makeMatch([player(0, 'mat', 9), player(1, 'elo', 9), player(2, 'roro', 9)], {
      items: 'high',
    });
    const mirror = new Match(host.config);
    const cache = new Map<number, Item>();
    let maxBytes = 0;
    for (let i = 0; i < 60 * 40; i++) {
      host.step([]);
      const buf = encodeSnapshot(takeSnapshot(host, host.drainEvents()));
      maxBytes = Math.max(maxBytes, buf.byteLength);
      applySnapshot(mirror, decodeSnapshot(buf)!, cache);
    }
    expect(maxBytes).toBeLessThanOrEqual(4096);
    for (const f of host.fighters) {
      const g = mirror.fighter(f.slot)!;
      expect(g.x).toBeCloseTo(f.x, 0);
      expect(g.state).toBe(f.state);
      expect(g.percent).toBeCloseTo(f.percent, 0);
    }
    expect(mirror.items.length).toBe(host.items.length);
    expect(mirror.projectiles.length).toBe(host.projectiles.length);
  });

  it('les commandes tiennent en 5 octets', () => {
    const v = new DataView(new ArrayBuffer(5));
    encodeControls({ x: -1, y: 0.5, cx: 0, cy: 1, buttons: BUTTONS.attack | BUTTONS.shield }, v, 0);
    const c = decodeControls(v, 0);
    expect(c.x).toBe(-1);
    expect(c.y).toBeCloseTo(0.5, 1);
    expect(c.buttons).toBe(BUTTONS.attack | BUTTONS.shield);
  });
});
