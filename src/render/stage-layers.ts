/* Habillage animé des stages : décors derrière et devant, eau ou lave, ambiance (vitesse, braises,
   feuilles, étincelles), et éclaboussures quand un combattant tombe dans le liquide. */
import type { Fighter } from '../sim/fighter/fighter';
import type { StageDef } from '../sim/stage/types';
import { drawLiquidBack, drawLiquidFront, type View } from './art/liquid';
import { drawScenery } from './art/scenery';
import type { Particles } from './fx/particles';

export function drawStageBack(ctx: CanvasRenderingContext2D, s: StageDef, v: View, time: number): void {
  if (s.scenery) drawScenery(ctx, s.scenery, s.theme, false);
  if (s.liquid) drawLiquidBack(ctx, s.liquid, v, time);
}

export function drawStageFront(ctx: CanvasRenderingContext2D, s: StageDef, v: View, time: number): void {
  if (s.liquid) drawLiquidFront(ctx, s.liquid, v, time);
  if (s.scenery) drawScenery(ctx, s.scenery, s.theme, true);
}

/** Particules d'ambiance, créées au fil des images dans la zone visible. */
export function ambience(P: Particles, s: StageDef, v: View & { top: number }, time: number): void {
  const w = v.right - v.left;
  const h = v.bottom - v.top;
  const rx = () => v.left + Math.random() * w;
  const ry = () => v.top + Math.random() * h;
  switch (s.ambience) {
    case 'speed':
      if (time % 2 === 0)
        P.add({
          kind: 'line',
          x: v.right + 40,
          y: ry(),
          vx: -38,
          vy: 0,
          size: 2,
          life: 22,
          color: 'rgba(255,255,255,0.7)',
        });
      return;
    case 'embers':
      if (time % 3 === 0)
        P.add({
          kind: 'glow',
          x: rx(),
          y: s.liquid?.y ?? v.bottom,
          vx: Math.random() - 0.5,
          vy: -1.5 - Math.random() * 2,
          size: 3,
          life: 90,
          color: '#ff8a2a',
        });
      return;
    case 'leaves':
      if (time % 9 === 0)
        P.add({
          kind: 'shard',
          x: rx(),
          y: v.top - 20,
          vx: 1.2,
          vy: 1.3,
          size: 3,
          life: 260,
          color: Math.random() > 0.5 ? '#e8a03a' : '#6cc04a',
          rot: Math.random() * 6,
        });
      return;
    case 'sparkles':
      if (time % 6 === 0) P.add({ kind: 'star', x: rx(), y: ry(), size: 4, life: 30, color: '#fff6c0' });
      return;
  }
}

/** Éclaboussure (eau) ou gerbe de flammes (lave) quand un combattant franchit la surface. */
export function splashes(
  P: Particles,
  s: StageDef,
  fighters: readonly Fighter[],
  lastY: Map<number, number>,
): void {
  const l = s.liquid;
  if (!l) return;
  for (const f of fighters) {
    const prev = lastY.get(f.slot);
    lastY.set(f.slot, f.y);
    if (prev === undefined || !(prev < l.y && f.y >= l.y)) continue;
    const water = l.kind === 'water';
    P.burst(f.x, l.y, 16, 9, water ? '#bff0ff' : '#ffb03a', water ? 'shard' : 'flame', 34);
    P.add({
      kind: 'ring',
      x: f.x,
      y: l.y,
      size: 12,
      grow: 4,
      life: 18,
      color: water ? '#ffffff' : '#ffd23a',
    });
  }
}
