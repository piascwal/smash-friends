/* Le mannequin du mode entraînement : il reste immobile, garde son bouclier, saute, marche, ou se bat
   comme une IA d'un niveau donné. */
import { NEUTRAL, type Controls } from '../core/input';
import type { Fighter } from '../fighter/fighter';
import type { Brain, Match } from '../match/match';
import { CpuBrain } from './brain';
import { ctrl } from './inputs';

export type DummyMode = 'immobile' | 'bouclier' | 'saute' | 'marche' | 'ia3' | 'ia6' | 'ia9';

export const DUMMY_MODES: { mode: DummyMode; label: string }[] = [
  { mode: 'immobile', label: 'Immobile' },
  { mode: 'bouclier', label: 'Bouclier' },
  { mode: 'saute', label: 'Saute' },
  { mode: 'marche', label: 'Marche' },
  { mode: 'ia3', label: 'IA niveau 3' },
  { mode: 'ia6', label: 'IA niveau 6' },
  { mode: 'ia9', label: 'IA niveau 9' },
];

export class DummyBrain implements Brain {
  mode: DummyMode = 'immobile';
  private cpu: CpuBrain | null = null;
  private cpuLevel = 0;
  /** Le bouclier s'use : on le baisse le temps qu'il se recharge, pour qu'il ne casse pas. */
  private resting = false;

  constructor(private readonly seed: number) {}

  think(m: Match, f: Fighter): Controls {
    if (f.state === 'respawn') return f.t > 30 ? ctrl(0, 1) : NEUTRAL;
    switch (this.mode) {
      case 'immobile':
        return NEUTRAL;
      case 'bouclier':
        if (f.shield < 12) this.resting = true;
        if (f.shield > 40) this.resting = false;
        return this.resting ? NEUTRAL : ctrl(0, 0, ['shield']);
      case 'saute':
        return m.frame % 70 < 2 ? ctrl(0, 0, ['jump']) : NEUTRAL;
      case 'marche': {
        // va-et-vient tranquille au centre du stage
        const dir = Math.floor(m.frame / 120) % 2 ? 1 : -1;
        return ctrl(dir * 0.5, 0);
      }
      default:
        return this.ai(Number(this.mode.slice(2))).think(m, f);
    }
  }

  private ai(level: number): CpuBrain {
    if (!this.cpu || this.cpuLevel !== level) {
      this.cpu = new CpuBrain(level, this.seed);
      this.cpuLevel = level;
    }
    return this.cpu;
  }
}
