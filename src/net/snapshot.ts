/* Instantané d'un combat, envoyé par l'hôte à chaque image : ce que le rendu des invités doit voir
   (combattants, projectiles, objets, événements). Les invités l'appliquent sur un match « miroir »
   qu'ils ne simulent pas eux-mêmes. */
import type { Fighter, StateId } from '../sim/fighter/fighter';
import { ITEMS } from '../sim/items/catalog';
import { Item } from '../sim/items/item';
import type { ItemId } from '../sim/items/types';
import type { GameEvent } from '../sim/match/events';
import type { Match, Phase } from '../sim/match/match';
import { PROJECTILES } from '../sim/projectiles/catalog';
import { Projectile } from '../sim/projectiles/projectile';
import type { ProjectileId } from '../sim/projectiles/types';

type FighterRow = [number, ...number[], string, string];
type ProjectileRow = [ProjectileId, number, number, number, number, number, number];
type ItemRow = [number, ItemId, number, number, number, number, number, number, number];

export interface Snapshot {
  f: number;
  ph: Phase;
  tl: number;
  sd: boolean;
  wt: number | null;
  F: FighterRow[];
  P: ProjectileRow[];
  I: ItemRow[];
  E: GameEvent[];
}

const r1 = (v: number) => Math.round(v * 10) / 10;

function fighterRow(f: Fighter, itemUid: number): FighterRow {
  const m = f.move;
  const rec = f.record;
  return [
    f.slot,
    r1(f.x),
    r1(f.y),
    r1(f.vx),
    r1(f.vy),
    r1(f.kbx),
    r1(f.kby),
    f.facing,
    f.t,
    r1(f.percent),
    f.stocks,
    f.score,
    r1(f.shield),
    f.hitlag,
    f.pendingLaunch ? 1 : 0,
    f.intangible,
    f.invincible,
    f.starPower,
    f.frozen,
    Math.round(f.spin),
    f.grounded ? 1 : 0,
    m?.frame ?? 0,
    m?.charging ? 1 : 0,
    m?.charge ?? 0,
    itemUid,
    rec.kos,
    rec.falls,
    rec.selfDestructs,
    Math.round(rec.damageDealt),
    f.eliminatedAt,
    f.state,
    m?.def.id ?? '',
  ];
}

export function takeSnapshot(m: Match, events: GameEvent[]): Snapshot {
  return {
    f: m.frame,
    ph: m.phase,
    tl: m.timeLeft,
    sd: m.suddenDeath,
    wt: m.winningTeam,
    F: m.fighters.map((f) => fighterRow(f, f.item?.uid ?? 0)),
    P: m.projectiles.map((p) => [p.def.id, p.owner, r1(p.x), r1(p.y), r1(p.vx), p.facing, p.age]),
    I: m.items.map((it) => [
      it.uid,
      it.def.id,
      r1(it.x),
      r1(it.y),
      Math.round(it.angle),
      it.holder,
      it.spawning,
      it.age,
      it.flying ? 1 : 0,
    ]),
    E: events,
  };
}

function applyFighter(m: Match, row: FighterRow, items: Map<number, Item>): void {
  const n = row as unknown as number[];
  const f = m.fighter(n[0]!);
  if (!f) return;
  const state = row[row.length - 2] as StateId;
  const moveId = row[row.length - 1] as string;
  [f.x, f.y, f.vx, f.vy, f.kbx, f.kby] = n.slice(1, 7) as [number, number, number, number, number, number];
  f.facing = n[7]! < 0 ? -1 : 1;
  if (f.state !== state) f.setState(state);
  f.t = n[8]!;
  [f.percent, f.stocks, f.score, f.shield, f.hitlag] = n.slice(9, 14) as [
    number,
    number,
    number,
    number,
    number,
  ];
  f.pendingLaunch = n[14] ? { kb: 0, angle: 0 } : null;
  [f.intangible, f.invincible, f.starPower, f.frozen, f.spin] = n.slice(15, 20) as [
    number,
    number,
    number,
    number,
    number,
  ];
  f.grounded = n[20] === 1;
  const def = moveId ? f.moves[moveId] : undefined;
  f.move = def
    ? {
        def,
        frame: n[21]!,
        charging: n[22] === 1,
        charge: n[23]!,
        chargeDone: false,
        hits: new Map(),
        chained: false,
      }
    : null;
  f.item = items.get(n[24]!) ?? null;
  [f.record.kos, f.record.falls, f.record.selfDestructs, f.record.damageDealt] = n.slice(25, 29) as [
    number,
    number,
    number,
    number,
  ];
  f.eliminatedAt = n[29]!;
}

/** Applique un instantané sur le match miroir ; `cache` garde l'identité des objets d'une image à l'autre. */
export function applySnapshot(m: Match, s: Snapshot, cache: Map<number, Item>): void {
  m.frame = s.f;
  m.phase = s.ph;
  m.timeLeft = s.tl;
  m.suddenDeath = s.sd;
  m.winningTeam = s.wt;
  m.stage.update(s.f);
  const items = new Map<number, Item>();
  for (const [uid, id, x, y, angle, holder, spawning, age, flying] of s.I) {
    const def = ITEMS[id];
    if (!def) continue;
    const it = cache.get(uid) ?? new Item(def, x, y);
    Object.assign(it, { x, y, angle, holder, spawning, age, flying: flying === 1 });
    items.set(uid, it);
  }
  cache.clear();
  for (const [k, v] of items) cache.set(k, v);
  m.items.splice(0, m.items.length, ...items.values());
  m.projectiles.splice(
    0,
    m.projectiles.length,
    ...s.P.filter(([id]) => PROJECTILES[id]).map(([id, owner, x, y, vx, facing, age]) => {
      const p = new Projectile(PROJECTILES[id], owner, -1, x, y, vx, 0, facing < 0 ? -1 : 1);
      p.age = age;
      return p;
    }),
  );
  for (const row of s.F) applyFighter(m, row, items);
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Encodé pour le canal de jeu (4 Ko au plus : au-delà, les événements sont abandonnés). */
export function encodeSnapshot(s: Snapshot): ArrayBuffer {
  let bytes = enc.encode(JSON.stringify(s));
  if (bytes.byteLength > 4000) bytes = enc.encode(JSON.stringify({ ...s, E: [] }));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function decodeSnapshot(data: ArrayBuffer): Snapshot | null {
  try {
    const s = JSON.parse(dec.decode(data)) as Snapshot;
    return Array.isArray(s.F) && Array.isArray(s.P) && Array.isArray(s.I) && Array.isArray(s.E) ? s : null;
  } catch {
    return null;
  }
}
