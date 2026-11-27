/* L'IA hors du stage : revenir (double saut, ruée, remontée), au rebord, et influence directionnelle. */
import type { Controls } from '../core/input';
import type { Rng } from '../core/rng';
import type { Fighter } from '../fighter/fighter';
import type { Match } from '../match/match';
import { ctrl } from './inputs';

/** Commandes pour revenir sur le stage. `skill` (0..1) : un niveau faible oublie parfois de remonter. */
export function recover(m: Match, f: Fighter, rng: Rng, skill: number): Controls {
  const p = m.stage.main;
  const left = f.x < p.x + p.w / 2;
  const edgeX = left ? p.x : p.x + p.w;
  const toward = left ? 1 : -1;
  const dx = Math.abs(f.x - edgeX);
  const below = f.y - p.y;
  const falling = f.vy + f.kby > -1;
  // sous le stage : contourner par le bord le plus proche
  if (f.x > p.x && f.x < p.x + p.w && f.y - f.height > p.y + p.h - 20) return ctrl(-toward, 0);
  if (f.state === 'helpless' || f.state === 'move') return ctrl(toward, 0);
  if (f.hitstun > 0) return ctrl(toward, -0.5);
  if (rng.chance(0.02 * (1 - skill))) return ctrl(0, 0); // hésitation des petits niveaux
  if (f.jumpsLeft > 0 && falling && (below > -60 || dx > 260)) return ctrl(toward, 0, ['jump']);
  if (!f.sideSpecialUsed && dx > 240 && below > -40 && below < 120 && skill > 0.2)
    return ctrl(toward, 0, ['special']);
  const needUp = below > 60 || (dx > 150 && below > -20);
  if (f.jumpsLeft === 0 && falling && needUp && below < 380) return ctrl(toward * 0.6, -1, ['special']);
  return ctrl(toward, 0);
}

/** Au rebord : remonter, sauter, rouler ou attaquer (varié pour ne pas être prévisible). */
export function ledgeOption(rng: Rng, f: Fighter): Controls {
  const r = rng.next();
  if (r < 0.35) return ctrl(f.facing, 0);
  if (r < 0.6) return ctrl(0, 0, ['jump']);
  if (r < 0.8) return ctrl(0, 0, ['shield']);
  return ctrl(0, 0, ['attack']);
}

/** Influence directionnelle : vers le centre et vers le haut, pour survivre plus longtemps. */
export function survivalDI(f: Fighter): Controls {
  const l = f.pendingLaunch;
  if (!l) return ctrl();
  const horizontal = Math.abs(Math.cos((l.angle * Math.PI) / 180)) > 0.5;
  const center = f.x < 0 ? 1 : -1;
  return horizontal ? ctrl(center * 0.7, -0.7) : ctrl(center, 0);
}
