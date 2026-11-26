import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/sim/stage/stages';
import { ROSTER } from '../src/sim/roster/characters';
import { makeMatch, player, skipCountdown } from './helpers';

function sane(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n) < 1e5;
}

describe('combat entre IA', () => {
  for (const stage of STAGES) {
    it(`4 IA niveau 9 sur ${stage.name} : le combat se termine sans valeur aberrante`, () => {
      const ids = ROSTER.map((d) => d.id);
      const players = [0, 1, 2, 3].map((s) => player(s, ids[(s * 3 + stage.id.length) % ids.length]!, 9));
      const m = makeMatch(players, { stageId: stage.id, stocks: 2, items: 'high' });
      let kos = 0;
      for (let i = 0; i < 60 * 60 * 6 && m.phase !== 'gameover'; i++) {
        m.step([]);
        kos += m.drainEvents().filter((e) => e.type === 'ko').length;
        for (const f of m.fighters) {
          if (!sane(f.x) || !sane(f.y) || !sane(f.percent)) throw new Error(`valeur aberrante ${f.def.id}`);
        }
      }
      expect(kos).toBeGreaterThan(2);
      expect(m.phase).toBe('gameover');
      expect(m.ranking()[0]!.place).toBe(1);
    });
  }

  it('mode temps : le chrono finit le combat', () => {
    const m = makeMatch([player(0, 'mat', 5), player(1, 'elo', 5)], { mode: 'time', minutes: 1 });
    for (let i = 0; i < 60 * 80 && m.phase !== 'gameover'; i++) m.step([]);
    expect(m.phase).toBe('gameover');
  });

  it('en équipes, deux contre un : les coéquipiers ne se blessent pas', () => {
    const m = makeMatch([player(0, 'lolo', 7, 0), player(1, 'jbg', 7, 0), player(2, 'mat', 7, 1)], {
      teams: true,
    });
    skipCountdown(m);
    for (let i = 0; i < 60 * 40; i++) {
      m.step([]);
      for (const e of m.drainEvents()) {
        if (e.type === 'hit' && e.attacker >= 0 && e.attacker !== e.victim) {
          expect(m.fighter(e.attacker)!.team === m.fighter(e.victim)!.team).toBe(false);
        }
      }
    }
  });
});

describe('classement', () => {
  it('le dernier éliminé est mieux classé que le premier', () => {
    const m = makeMatch([player(0, 'mat', 9), player(1, 'elo', 9), player(2, 'lolo', 9)], { stocks: 1 });
    for (let i = 0; i < 60 * 60 * 6 && m.phase !== 'gameover'; i++) m.step([]);
    const places = m.ranking().map((r) => r.place);
    expect(places).toEqual([1, 2, 3]);
  });
});
