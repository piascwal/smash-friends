/* Assemble le jeu de coups d'un personnage : coups communs + ses spéciaux, mis à l'échelle de sa
   vitesse (durées) et de sa puissance (dégâts). */
import type { FighterDef } from '../roster/types';
import { bair, dair, fair, nair, uair } from './aerials';
import { bthrow, dashGrab, dthrow, fthrow, getupAttack, grab, ledgeAttack, pummel, uthrow } from './grabs';
import { itemShoot, itemSmash, itemSwing, itemThrow } from './items';
import { dashAttack, dsmash, dtilt, fsmash, ftilt, jab1, jab2, jab3, usmash, utilt } from './ground';
import type { MoveDef, Moveset } from './types';

const range = (r: [number, number] | undefined, k: number): [number, number] | undefined =>
  r && [Math.round(r[0] * k), Math.round(r[1] * k)];

/** Allonge ou raccourcit toutes les durées d'un coup, et multiplie ses dégâts. */
export function scaleMove(m: MoveDef, speed: number, power: number): MoveDef {
  const f = (n: number) => Math.max(1, Math.round(n * speed));
  return {
    ...m,
    total: f(m.total),
    windupEnd: m.windupEnd && f(m.windupEnd),
    hitboxes: m.hitboxes.map((h) => ({
      ...h,
      start: f(h.start),
      end: Math.max(f(h.start), f(h.end)),
      dmg: Math.round(h.dmg * power * 10) / 10,
    })),
    motion: m.motion?.map((s) => ({ ...s, frame: f(s.frame) })),
    charge: m.charge && { ...m.charge, frame: f(m.charge.frame) },
    landingLag: m.landingLag && f(m.landingLag),
    intangible: range(m.intangible, speed),
    armor: range(m.armor, speed),
    counter: range(m.counter, speed),
    reflect: range(m.reflect, speed),
    projectile: m.projectile && { ...m.projectile, frame: f(m.projectile.frame) },
    next: m.next && { ...m.next, from: f(m.next.from), to: f(m.next.to) },
    fx: m.fx?.flipAt ? { ...m.fx, flipAt: f(m.fx.flipAt) } : m.fx,
  };
}

export function buildMoveset(def: FighterDef): Moveset {
  const { speed, power } = def.stats;
  const sp = def.specials;
  const raw: Record<string, MoveDef> = {
    jab1,
    jab2,
    jab3,
    ftilt,
    utilt,
    dtilt,
    dash: def.dashPose ? { ...dashAttack, pose: def.dashPose } : dashAttack,
    fsmash,
    usmash,
    dsmash,
    nair,
    fair,
    bair,
    uair,
    dair,
    nspecial: sp.nspecial,
    sspecial: sp.sspecial,
    uspecial: sp.uspecial,
    dspecial: sp.dspecial,
    grab,
    dashgrab: dashGrab,
    pummel,
    fthrow,
    bthrow,
    uthrow,
    dthrow,
    getup: getupAttack,
    ledge: ledgeAttack,
    itemswing: itemSwing,
    itemsmash: itemSmash,
    itemshoot: itemShoot,
    itemthrow: itemThrow,
  };
  if (sp.nspecial_air) raw.nspecial_air = sp.nspecial_air;
  if (sp.dspecial_air) raw.dspecial_air = sp.dspecial_air;
  for (const m of sp.extra ?? []) raw[m.id] = m;
  const out: Record<string, MoveDef> = {};
  for (const [key, m] of Object.entries(raw)) out[key] = scaleMove({ ...m, id: key }, speed, power);
  return out as Moveset;
}
