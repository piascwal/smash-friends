/* Tout ce qu'un combat doit avoir chargé avant de commencer : poses des combattants, images de leurs
   projectiles, objets, décor de fond. */
import { ITEM_LIST } from '../sim/items/catalog';
import { PROJECTILES } from '../sim/projectiles/catalog';
import type { MatchConfig } from '../sim/match/config';
import { stageParId } from '../sim/stage/stages';
import {
  backdropUrl,
  loadCharacter,
  loadImage,
  loadProp,
  loadProjectileImage,
  type CharacterAssets,
} from './loader';

export interface MatchAssets {
  /** Par emplacement de joueur. */
  fighters: Map<number, CharacterAssets>;
  /** Image de chaque projectile, par emplacement puis par pose (« pj_ »). */
  projectiles: Map<string, HTMLImageElement>;
  items: Map<string, HTMLImageElement>;
  backdrop: HTMLImageElement | null;
}

export const projectileKey = (slot: number, pose: string): string => `${slot}:${pose}`;

export async function loadMatchAssets(config: MatchConfig): Promise<MatchAssets> {
  const fighters = new Map<number, CharacterAssets>();
  const projectiles = new Map<string, HTMLImageElement>();
  const items = new Map<string, HTMLImageElement>();
  const poses = new Set<string>();
  for (const def of Object.values(PROJECTILES))
    for (const p of [def.image, ...(def.anim ?? [])]) if (p) poses.add(p);
  const stage = stageParId(config.stageId);
  const [backdrop] = await Promise.all([
    loadImage(backdropUrl(stage.backdrop)).catch(() => null),
    ...config.players.map(async (p) => {
      fighters.set(p.slot, await loadCharacter(p.charId));
      for (const pose of poses) {
        const img = await loadProjectileImage(p.charId, pose);
        if (img) projectiles.set(projectileKey(p.slot, pose), img);
      }
    }),
    ...ITEM_LIST.filter((d) => d.image).map(async (d) => {
      const img = await loadProp(d.image!).catch(() => null);
      if (img) items.set(d.id, img);
    }),
  ]);
  return { fighters, projectiles, items, backdrop };
}
