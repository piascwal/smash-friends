/* Déplacements de l'IA sans aller-retour : elle freine avant d'arriver, ne repart dans l'autre sens
   qu'une fois arrêtée, marche quand c'est près et court quand c'est loin, et ne saute pas dans le vide. */
import { NEUTRAL, type Controls } from '../core/input';
import { PHYSICS } from '../core/config';
import type { Fighter } from '../fighter/fighter';
import type { Match } from '../match/match';
import { ctrl } from './inputs';

export class Mover {
  /** Sens du déplacement en cours (0 : arrêté). */
  private dir = 0;
  /** Images passées à pousser le stick sans avancer (un mur, un pilier) : on saute par-dessus. */
  private stuck = 0;

  stop(): void {
    this.dir = 0;
  }

  /** Va vers `x` et s'arrête à `stop` pixels près. */
  to(m: Match, f: Fighter, x: number, stop: number): Controls {
    // on ne descend d'une plateforme que s'il y a du sol en dessous, et on reste loin des zones d'éjection
    const p = f.grounded && f.platform ? f.platform : m.stage.main;
    const b = m.stage.def.blast;
    const safe = (edgeX: number) => !!m.stage.landing(edgeX, p.y + 1, b.bottom, false);
    const lo = Math.max(safe(p.x - 30) ? b.left : p.x + 45, b.left + 260);
    const hi = Math.min(safe(p.x + p.w + 30) ? b.right : p.x + p.w - 45, b.right - 260);
    const goal = Math.max(lo, Math.min(hi, x));
    const dx = goal - f.x;
    const dir = Math.sign(dx);
    // distance de freinage à la vitesse actuelle : on lâche le stick à temps
    const brake = (f.vx * f.vx) / (2 * PHYSICS.friction);
    const moving = Math.sign(f.vx) === dir ? brake : 0;
    if (Math.abs(dx) <= stop + moving) {
      this.dir = 0;
      return NEUTRAL;
    }
    // jamais de demi-tour en pleine course : d'abord s'arrêter
    if (this.dir !== 0 && dir !== this.dir) {
      this.dir = 0;
      return NEUTRAL;
    }
    if (this.dir === 0 && Math.abs(f.vx) > 1.5) return NEUTRAL;
    this.dir = dir;
    this.stuck = Math.abs(f.vx) < 0.4 && f.grounded ? this.stuck + 1 : 0;
    if (this.stuck > 14) {
      this.stuck = 0;
      return ctrl(dir, 0, ['jump']);
    }
    const far = Math.abs(dx) > 200;
    return ctrl(dir * (far ? 1 : 0.6), 0);
  }

  /** Se tourne vers la cible sans bouger (une image de marche légère). */
  face(f: Fighter, t: Fighter): Controls {
    const dir = t.x < f.x ? -1 : 1;
    if (f.facing === dir || f.state !== 'idle') return NEUTRAL;
    return ctrl(dir * 0.4, 0);
  }
}
