/* Ce que l'IA perçoit : sa cible, les coups qui arrivent, et les moments où l'adversaire est
   vulnérable (atterrissage, coup raté, au sol, bouclier lâché). */
import { activeHitboxes } from '../combat/hits';
import type { Fighter } from '../fighter/fighter';
import type { Match } from '../match/match';
import type { Platform } from '../stage/platforms';

export function pickTarget(m: Match, f: Fighter, current: Fighter | null): Fighter | null {
  let best: Fighter | null = null;
  let bestScore = Infinity;
  for (const o of m.fighters) {
    if (o === f || o.team === f.team || !o.alive || o.state === 'respawn') continue;
    // préfère les cibles proches, un peu celles qui ont beaucoup de pourcents, et garde la sienne
    const score =
      Math.hypot(o.x - f.x, o.y - f.y) -
      o.percent * 0.8 +
      (o.invincible > 0 ? 400 : 0) -
      (o === current ? 150 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best;
}

/** Un coup ou un projectile ennemi arrive-t-il sur nous ? */
export function threatened(m: Match, f: Fighter): boolean {
  for (const o of m.fighters) {
    if (o.team === f.team || !o.move) continue;
    const d = Math.hypot(o.x - f.x, o.y - f.y);
    if (d > 190 * o.size) continue;
    const mv = o.move;
    const soon = mv.def.hitboxes.some((h) => h.start - mv.frame <= 20 && h.end >= mv.frame);
    if (soon || activeHitboxes(o).length) return true;
  }
  return m.projectiles.some(
    (p) =>
      p.team !== f.team &&
      Math.hypot(p.x - f.cx, p.y - f.cy) < 150 &&
      Math.sign(f.x - p.x) === Math.sign(p.vx || 1),
  );
}

/** L'adversaire ne peut pas se défendre tout de suite : c'est le moment de frapper. */
export function vulnerable(t: Fighter): boolean {
  if (['landing', 'knockdown', 'shieldrelease', 'helpless', 'dizzy', 'getup'].includes(t.state)) return true;
  const mv = t.move;
  if (t.state !== 'move' || !mv) return false;
  // fin d'un coup : plus aucune zone de frappe à venir
  return mv.def.hitboxes.every((h) => h.end < mv.frame) && mv.def.total - mv.frame > 8;
}

/** Distance jusqu'au bord du stage principal dans la direction donnée. */
export function roomAhead(m: Match, f: Fighter, dir: number): number {
  const p = m.stage.main;
  return dir > 0 ? p.x + p.w - f.x : f.x - p.x;
}

/** Hors du stage : en l'air sans aucun sol en dessous (on tombe dans le vide). */
export function offstage(m: Match, f: Fighter): boolean {
  if (f.grounded) return false;
  return !m.stage.landing(f.x, f.y, m.stage.def.blast.bottom, false);
}

/** Le point de sol plein le plus proche (pour revenir sur le stage). */
export function nearestGround(m: Match, f: Fighter): { x: number; y: number; p: Platform } {
  let best = { x: 0, y: 0, p: m.stage.main };
  let bestD = Infinity;
  const b = m.stage.def.blast;
  for (const p of m.stage.platforms) {
    if (!p.solid) continue;
    const x = Math.max(Math.max(p.x, b.left + 200), Math.min(Math.min(p.x + p.w, b.right - 200), f.x));
    const d = Math.hypot(x - f.x, (p.y - f.y) * 1.5);
    if (d < bestD) {
      bestD = d;
      best = { x, y: p.y, p };
    }
  }
  return best;
}

/** Le personnage lance-t-il un projectile avec son spécial neutre ? */
export const hasProjectile = (f: Fighter): boolean => !!f.moves.nspecial.projectile;
