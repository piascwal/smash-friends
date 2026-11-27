import { describe, expect, it } from 'vitest';
import { applyDI, knockback, resolveAngle } from '../src/sim/combat/knockback';
import { predictKO } from '../src/sim/combat/predict';

describe('éjection', () => {
  it('grandit avec les pourcents', () => {
    const at = (percent: number) => knockback({ percent, damage: 16, weight: 100, bkb: 30, kbg: 100 });
    expect(at(120)).toBeGreaterThan(at(60));
    expect(at(60)).toBeGreaterThan(at(10));
  });

  it('les poids lourds volent moins loin', () => {
    const k = (weight: number) => knockback({ percent: 100, damage: 15, weight, bkb: 30, kbg: 100 });
    expect(k(124)).toBeLessThan(k(82));
  });

  it("l'éjection fixe ne dépend pas des pourcents", () => {
    const k = (percent: number) => knockback({ percent, damage: 2, weight: 100, bkb: 0, kbg: 100, wkb: 30 });
    expect(k(0)).toBeCloseTo(k(150));
  });

  it('angle automatique : à plat pour un petit coup au sol, diagonale sinon', () => {
    expect(resolveAngle(361, 20, true)).toBe(0);
    expect(resolveAngle(361, 80, true)).toBe(44);
    expect(resolveAngle(361, 80, false)).toBe(45);
  });

  it("l'influence directionnelle dévie de 18° au plus", () => {
    expect(applyDI(45, 0, 0)).toBe(45);
    const up = applyDI(0, 0, 1);
    expect(up).toBeGreaterThan(0);
    expect(up).toBeLessThanOrEqual(18);
  });

  it('un smash avant éjecte vers 100-130 % depuis le centre, pas à 40 %', () => {
    const blast = { left: -1150, right: 1150, top: -980, bottom: 640 };
    const traj = { x: 0, y: -50, gravity: 0.72, fall: 11 };
    const kb = (p: number) => knockback({ percent: p, damage: 16, weight: 100, bkb: 30, kbg: 100 });
    expect(predictKO(traj, kb(40), 44, blast)).toBe(false);
    expect(predictKO(traj, kb(150), 44, blast)).toBe(true);
  });
});
