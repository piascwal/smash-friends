/* Éjections (sortie des zones), crédit du KO, et retour sur la plateforme de réapparition. */
import { RESPAWN } from '../core/config';
import type { Fighter } from '../fighter/fighter';
import { releaseGrab } from '../fighter/grab';
import { dropItem } from '../items/carry';
import type { World } from '../world';
import type { BlastSide } from './events';

/** Délai pendant lequel le dernier coup reçu compte pour le KO (images). */
const CREDIT = 8 * 60;

export function blastSide(f: Fighter, w: World): BlastSide | null {
  const b = w.stage.def.blast;
  if (f.x < b.left) return 'left';
  if (f.x > b.right) return 'right';
  if (f.y > b.bottom) return 'bottom';
  // en haut, il faut être en train de monter (ou en vrille) pour être éjecté
  if (f.y - f.height < b.top && (f.kby + f.vy < 0 || f.state === 'tumble')) return 'top';
  return null;
}

export function knockOut(f: Fighter, w: World, side: BlastSide, timed: boolean): void {
  const credited =
    f.lastHitBy >= 0 && w.frame - f.lastHitFrame < CREDIT ? w.fighters[f.lastHitBy] : undefined;
  if (credited && credited !== f) {
    credited.record.kos++;
    credited.score++;
  } else f.record.selfDestructs++;
  f.record.falls++;
  f.score--;
  if (!timed) f.stocks--;
  if (!timed && f.stocks <= 0) f.eliminatedAt = w.frame;
  const star = side === 'top' && w.rng.chance(0.5);
  w.emit({ type: 'ko', who: f.slot, x: f.x, y: f.cy, side, star, by: credited?.slot ?? -1 });
  if (f.partner) releaseGrab(f);
  dropItem(f);
  f.setState('dead');
  f.respawnTimer = RESPAWN.delay;
  f.vx = f.vy = f.kbx = f.kby = 0;
  f.hitlag = 0;
  f.pendingLaunch = null;
  f.lastHitBy = -1;
}

export function updateDead(f: Fighter, w: World, timed: boolean): void {
  if (f.stocks <= 0 && !timed) return;
  if (--f.respawnTimer > 0) return;
  const r = w.stage.def.respawn;
  f.x = r.x + (f.slot - 1.5) * 50;
  f.y = r.y;
  f.percent = 0;
  f.shield = 50;
  f.facing = f.x < 0 ? 1 : -1;
  f.setState('respawn', RESPAWN.platform);
  f.grounded = false;
  f.resetAirOptions();
  f.ledgeInvincibleReady = true;
  w.emit({ type: 'respawn', who: f.slot });
}

/** Sur la plateforme de retour : on la quitte en bougeant (ou au bout du temps), invincible un moment. */
export function updateRespawn(f: Fighter): void {
  f.t++;
  const c = f.ctl;
  const moved = Math.abs(c.cur.x) > 0.4 || c.cur.y > 0.5 || c.cur.buttons !== 0;
  if ((f.t > 30 && moved) || f.t >= f.duration) {
    f.setState('air');
    f.invincible = RESPAWN.invincible;
    if (c.cur.y > 0.5) f.fastFalling = true;
  }
}
