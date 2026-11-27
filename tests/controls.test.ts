import { describe, expect, it } from 'vitest';
import { BUTTONS, type Controls } from '../src/sim/core/input';
import { ITEMS } from '../src/sim/items/catalog';
import { Item } from '../src/sim/items/item';
import { makeMatch, player, skipCountdown } from './helpers';

const input = (x = 0, y = 0, buttons = 0): Controls => ({ x, y, cx: 0, cy: 0, buttons });

function setup() {
  const m = makeMatch([player(0, 'jbg'), player(1, 'mat')], { items: 'off' });
  skipCountdown(m);
  for (let i = 0; i < 10; i++) m.step([input()]);
  return { m, f: m.fighter(0)! };
}

describe('commandes simplifiées', () => {
  it('direction + A tenu charge un smash, qui part au relâché', () => {
    const { m, f } = setup();
    for (let i = 0; i < 30; i++) m.step([input(1, 0, BUTTONS.attack)]);
    expect(f.move?.def.id).toBe('fsmash');
    expect(f.move?.charging).toBe(true);
    expect(f.move!.charge).toBeGreaterThan(10);
    m.step([input()]);
    m.step([input()]);
    expect(f.move?.charging).toBe(false);
    expect(f.move?.def.id).toBe('fsmash');
  });

  it('direction + A bref donne le coup rapide (tilt)', () => {
    const { m, f } = setup();
    m.step([input(0, 1, BUTTONS.attack)]);
    m.step([input(0, 1)]);
    m.step([input(0, 1)]);
    expect(f.move?.def.id).toBe('dtilt');
  });

  it('A sans direction : jab', () => {
    const { m, f } = setup();
    m.step([input(0, 0, BUTTONS.attack)]);
    expect(f.move?.def.id).toBe('jab1');
  });

  it('le stick vers le haut fait sauter, même glissé lentement (tactile)', () => {
    const { m, f } = setup();
    for (const y of [-0.2, -0.3, -0.4, -0.5, -0.65, -0.8]) m.step([input(0, y)]);
    for (let i = 0; i < 6; i++) m.step([input(0, -0.8)]);
    expect(f.grounded).toBe(false);
    expect(f.vy).toBeLessThan(0);
  });

  it('B lance l’objet tenu', () => {
    const { m, f } = setup();
    const it = new Item(ITEMS.dauphin, f.x, f.y - 20);
    it.spawning = 0;
    m.items.push(it);
    m.step([input(0, 0, BUTTONS.attack)]);
    expect(f.item).toBe(it);
    for (let i = 0; i < 10; i++) m.step([input()]);
    m.step([input(1, 0, BUTTONS.special)]);
    for (let i = 0; i < 10; i++) m.step([input()]);
    expect(f.item).toBeNull();
    expect(it.thrownBy).toBe(0);
  });
});

describe('collisions entre combattants', () => {
  it('deux combattants qui marchent l’un vers l’autre se bloquent', () => {
    const m = makeMatch([player(0, 'jbg'), player(1, 'mat')], { items: 'off', stageId: 'vieux-port' });
    skipCountdown(m);
    const [a, b] = m.fighters;
    a!.x = -60;
    b!.x = 60;
    for (let i = 0; i < 120; i++) m.step([input(1, 0), input(-1, 0)]);
    expect(Math.abs(a!.x - b!.x)).toBeGreaterThan(25);
    expect(a!.x).toBeLessThan(b!.x);
  });
});

describe('avancer en frappant', () => {
  it('mitrailler A en tenant l’avant : on frappe et on avance en même temps', () => {
    const { m, f } = setup();
    f.facing = 1;
    const x0 = f.x;
    let punches = 0;
    for (let i = 0; i < 60; i++) {
      m.step([input(1, 0, i % 6 < 3 ? BUTTONS.attack : 0)]);
      if (f.move?.def.id.startsWith('jab')) punches++;
    }
    expect(punches).toBeGreaterThan(30);
    expect(f.x - x0).toBeGreaterThan(100);
  });

  it('direction avant + A tenu : coup de poing immédiat, puis smash chargé', () => {
    const { m, f } = setup();
    m.step([input(1, 0, BUTTONS.attack)]);
    expect(f.move?.def.id).toBe('jab1');
    for (let i = 0; i < 20; i++) m.step([input(1, 0, BUTTONS.attack)]);
    expect(f.move?.def.id).toBe('fsmash');
    expect(f.move?.charging).toBe(true);
  });
});

describe('structures des stages', () => {
  it('on ne traverse pas un pilier en marchant', () => {
    const m = makeMatch([player(0, 'jbg'), player(1, 'mat')], { items: 'off', stageId: 'chateau' });
    skipCountdown(m);
    const f = m.fighter(0)!;
    for (let i = 0; i < 180; i++) m.step([input(1, 0)]);
    // la tour centrale va de -70 à 70 : on reste à sa gauche
    expect(f.x).toBeLessThan(-60);
  });
});
