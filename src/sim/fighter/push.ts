/* Les combattants ne se superposent pas : deux corps qui se touchent se repoussent (on bloque
   l'adversaire en marchant contre lui). On passe quand même à travers en roulant, en esquivant ou
   quand on est éjecté. */
import type { Fighter, StateId } from './fighter';

const PASS_THROUGH = new Set<StateId>([
  'dead',
  'respawn',
  'ledge',
  'roll',
  'spotdodge',
  'airdodge',
  'tech',
  'tumble',
  'hitstun',
  'knockdown',
]);

/** Part de la largeur des corps qui peut se chevaucher (les silhouettes ne sont pas des boîtes). */
const BODY = 0.75;

const solid = (f: Fighter) => !PASS_THROUGH.has(f.state) && f.invincible <= 0 && f.intangible <= 0;

function overlapY(a: Fighter, b: Fighter): boolean {
  return a.y - a.height < b.y && b.y - b.height < a.y;
}

/** Décale le combattant, sans le faire tomber du bord s'il est au sol ; renvoie le décalage réel. */
function shift(f: Fighter, dx: number): number {
  const p = f.platform;
  let x = f.x + dx;
  if (f.grounded && p) x = Math.max(p.x, Math.min(p.x + p.w, x));
  const done = x - f.x;
  f.x = x;
  return done;
}

export function separateFighters(fighters: readonly Fighter[]): void {
  for (let i = 0; i < fighters.length; i++) {
    for (let j = i + 1; j < fighters.length; j++) {
      const a = fighters[i]!;
      const b = fighters[j]!;
      if (!solid(a) || !solid(b) || !overlapY(a, b)) continue;
      const dx = b.x - a.x;
      const overlap = ((a.width + b.width) / 2) * BODY - Math.abs(dx);
      if (overlap <= 0) continue;
      const dir = dx !== 0 ? Math.sign(dx) : a.slot < b.slot ? 1 : -1;
      // on résout tout le chevauchement : même en courant, on ne traverse pas l'adversaire
      const push = overlap / 2;
      // si l'un est bloqué par le bord, l'autre recule d'autant
      const movedA = shift(a, -dir * push);
      shift(b, dir * (push + (push - Math.abs(movedA))));
    }
  }
}
