/* Mode entraînement : zones sensibles des combattants (jaune) et zones de frappe actives (rouge). */
import { activeHitboxes } from '../sim/combat/hits';
import type { Match } from '../sim/match/match';

export function drawHitboxes(ctx: CanvasRenderingContext2D, m: Match): void {
  ctx.save();
  ctx.lineWidth = 2;
  for (const f of m.fighters) {
    if (!f.alive) continue;
    const r = f.hurtbox();
    ctx.fillStyle = f.vulnerable ? 'rgba(255,220,60,0.25)' : 'rgba(120,200,255,0.25)';
    ctx.strokeStyle = f.vulnerable ? 'rgba(255,220,60,0.8)' : 'rgba(120,200,255,0.8)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    for (const h of activeHitboxes(f)) {
      ctx.fillStyle = 'rgba(255,40,40,0.45)';
      ctx.strokeStyle = '#ff2828';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}
