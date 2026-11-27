import { describe, expect, it } from 'vitest';
import { DUMMY_MODES, DummyBrain } from '../src/sim/ai/dummy';
import { DEFAULT_RULES } from '../src/sim/match/config';
import { Match } from '../src/sim/match/match';
import { player } from './helpers';

describe('mode entraînement', () => {
  it('le mannequin fonctionne dans tous ses modes', () => {
    const dummy = new DummyBrain(7);
    const m = new Match(
      {
        ...DEFAULT_RULES,
        stageId: 'vieux-port',
        players: [player(0, 'jbg', 0), player(1, 'mat', 0)],
        seed: 3,
        stocks: 99,
      },
      [null, dummy],
    );
    for (const { mode } of DUMMY_MODES) {
      dummy.mode = mode;
      for (let i = 0; i < 600; i++) m.step([]);
      const d = m.fighter(1)!;
      expect(Number.isFinite(d.x)).toBe(true);
      if (mode === 'bouclier') expect(d.state).not.toBe('dizzy');
    }
  });
});
