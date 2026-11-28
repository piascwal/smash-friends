/* Tous les stages du jeu. */
import { OPEN_STAGES } from './open-stages';
import { SCENIC_STAGES } from './scenic-stages';
import { STRUCTURE_STAGES } from './structure-stages';
import type { StageDef } from './types';

export const STAGES: readonly StageDef[] = [...SCENIC_STAGES, ...OPEN_STAGES, ...STRUCTURE_STAGES];

export const stageParId = (id: string): StageDef => STAGES.find((s) => s.id === id) ?? STAGES[0]!;
