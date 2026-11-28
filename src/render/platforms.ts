/* Les plateformes, dessinées en pixel art selon ce qu'elles représentent (terre herbeuse, toit,
   château, ponton, carlingue, branche, auvent, nuage…), préparées une fois puis agrandies sans lissage. */
import type { Platform } from '../sim/stage/platforms';
import type { Material, PlatformLook, Theme } from '../sim/stage/types';
import { castle, hull, house, metal, neon, wood } from './art/built-looks';
import { basalt, earth, ice, rock, sand, type LookContext } from './art/ground-looks';
import { PX, PixelCanvas } from './art/pixels';
import { awning, branch, cloud, girder, plank } from './art/thin-looks';

interface LookSpec {
  paint: (ctx: LookContext) => void;
  /** Débords en gros pixels : côtés, dessus, dessous. */
  pad: [number, number, number];
}

const LOOKS: Record<PlatformLook, LookSpec> = {
  earth: { paint: earth, pad: [2, 3, 10] },
  rock: { paint: rock, pad: [1, 2, 2] },
  basalt: { paint: basalt, pad: [1, 2, 2] },
  sand: { paint: sand, pad: [1, 2, 2] },
  ice: { paint: ice, pad: [1, 2, 8] },
  house: { paint: house, pad: [5, 1, 1] },
  castle: { paint: castle, pad: [1, 4, 1] },
  wood: { paint: wood, pad: [1, 1, 1] },
  metal: { paint: metal, pad: [1, 1, 1] },
  neon: { paint: neon, pad: [1, 1, 1] },
  hull: { paint: hull, pad: [16, 2, 2] },
  plank: { paint: plank, pad: [1, 1, 5] },
  branch: { paint: branch, pad: [3, 5, 4] },
  awning: { paint: awning, pad: [1, 1, 4] },
  cloud: { paint: cloud, pad: [3, 6, 4] },
  girder: { paint: girder, pad: [1, 1, 1] },
};

const SOLID_BY_MATERIAL: Record<Material, PlatformLook> = {
  pierre: 'rock',
  herbe: 'earth',
  bois: 'wood',
  metal: 'metal',
  neon: 'neon',
  sable: 'sand',
  glace: 'ice',
};

const THIN_BY_MATERIAL: Record<Material, PlatformLook> = {
  pierre: 'plank',
  herbe: 'branch',
  bois: 'plank',
  metal: 'girder',
  neon: 'girder',
  sable: 'plank',
  glace: 'girder',
};

export const lookOfPlatform = (p: Platform, t: Theme): PlatformLook =>
  p.def.look ?? (p.solid ? SOLID_BY_MATERIAL : THIN_BY_MATERIAL)[t.material];

const cache = new WeakMap<Platform, PixelCanvas>();

function platformArt(p: Platform, t: Theme): PixelCanvas {
  let art = cache.get(p);
  if (art) return art;
  const spec = LOOKS[lookOfPlatform(p, t)];
  const [padX, padTop, padBottom] = spec.pad;
  art = new PixelCanvas(Math.ceil(p.w / PX), Math.max(2, Math.ceil(p.h / PX)), padX, padTop, padBottom);
  spec.paint({ c: art, t, island: p.solid && (p.def.shape ?? 'island') === 'island' });
  cache.set(p, art);
  return art;
}

export function drawPlatforms(ctx: CanvasRenderingContext2D, platforms: readonly Platform[], t: Theme): void {
  ctx.imageSmoothingEnabled = false;
  for (const p of platforms) platformArt(p, t).draw(ctx, p.x, p.y);
  ctx.imageSmoothingEnabled = true;
}
