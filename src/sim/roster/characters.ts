/* Le roster : pour chaque personnage de la banque, ses stats et ses quatre coups spéciaux, choisis
   d'après son style (et les images de coups spéciaux que la banque a pour lui). */
import * as S from '../moves/specials';
import { FLOTTANT, LEGER, LOURD, MOYEN } from './archetypes';
import type { FighterDef, Stats } from './types';

const st = (base: Stats, over: Partial<Stats> = {}): Stats => ({ ...base, ...over });

export const ROSTER: readonly FighterDef[] = [
  {
    id: 'jbg',
    style: 'balanced',
    archetype: 'Polyvalent',
    stats: st(MOYEN),
    specials: {
      nspecial: S.shoot('sp_energy_cast', 'boule_feu'),
      sspecial: S.dash('kick_heavy', { effect: 'fire' }),
      uspecial: S.rising('sp_rising_uppercut', { dmg: 15, effect: 'fire', lift: 20 }),
      dspecial: S.slam('sp_energy_cast'),
      dspecial_air: S.slamAir('jump_kick'),
    },
  },
  {
    id: 'mat',
    style: 'boxer',
    archetype: 'Puncheur',
    stats: st(MOYEN, { run: 8.6, power: 1.08, weight: 102 }),
    specials: {
      nspecial: S.chargePunch('super', 'sp_hook_lunge'),
      sspecial: S.dash('sp_dash_punch', { speed: 16, dmg: 12 }),
      uspecial: S.rising('uppercut', { dmg: 13 }),
      dspecial: S.flurry('punch_light'),
    },
    dashPose: 'sp_dash_punch',
  },
  {
    id: 'lolo',
    style: 'heavy',
    archetype: 'Poids lourd',
    stats: st(LOURD, { weight: 124 }),
    specials: {
      nspecial: S.shoot('sp_ground_slam', 'onde_sol', 14, 46),
      sspecial: S.dash('sp_shoulder_charge', { armor: true, dmg: 14, speed: 12 }),
      uspecial: S.rising('uppercut', { lift: 17, dmg: 14 }),
      dspecial: S.slam('sp_ground_slam'),
      dspecial_air: S.slamAir('jump_kick'),
    },
    dashPose: 'sp_shoulder_charge',
  },
  {
    id: 'soso',
    style: 'acrobat',
    archetype: 'Voltigeuse',
    stats: st(LEGER, { airJumps: 2 }),
    specials: {
      nspecial: S.shoot('punch_heavy', 'orbe'),
      sspecial: S.dash('sp_slide', { low: true, angle: 75, speed: 15 }),
      uspecial: S.rising('sp_rising_spin', { spin: true, lift: 20 }),
      dspecial: S.spin('dspecial', 'kick_heavy'),
      dspecial_air: S.slamAir('jump_kick'),
    },
    dashPose: 'sp_slide',
  },
  {
    id: 'bubu',
    style: 'beam',
    archetype: 'Zoneur',
    stats: st(MOYEN, { weight: 98 }),
    specials: {
      nspecial: S.shoot('sp_energy_cast', 'rayon', 12, 38),
      sspecial: S.dash('punch_heavy', { effect: 'electric' }),
      uspecial: S.rising('uppercut', { effect: 'electric' }),
      dspecial: S.burst('sp_burst'),
    },
  },
  {
    id: 'jbm',
    style: 'counter',
    archetype: 'Contre',
    stats: st(LOURD, { weight: 110, run: 7.6, size: 1.08 }),
    specials: {
      nspecial: S.shoot('sp_palm_strike', 'paume'),
      sspecial: S.dash('sp_palm_strike', { dmg: 12 }),
      uspecial: S.rising('uppercut', { lift: 18 }),
      dspecial: S.counter('sp_counter_stance', 'sp_palm_strike')[0]!,
      extra: [S.counter('sp_counter_stance', 'sp_palm_strike')[1]!],
    },
  },
  {
    id: 'roulie',
    style: 'ice',
    archetype: 'Givre',
    stats: st(FLOTTANT, { airJumps: 1 }),
    specials: {
      nspecial: S.shoot('sp_energy_cast', 'eclat_glace'),
      sspecial: S.dash('punch_heavy', { effect: 'ice' }),
      uspecial: S.levitate('jump'),
      dspecial: S.slam('sp_ground_slam', 'pic_glace'),
    },
  },
  {
    id: 'clem',
    style: 'trainer',
    archetype: 'Dresseuse',
    stats: st(MOYEN, { weight: 95 }),
    specials: {
      nspecial: S.shoot('sp_call_pet', 'chien', 14, 42),
      sspecial: S.dash('kick_heavy'),
      uspecial: S.rising('sp_signal_jump', { lift: 21, dmg: 9 }),
      dspecial: S.slam('crouch_punch'),
      dspecial_air: S.slamAir('jump_kick'),
    },
  },
  {
    id: 'elo',
    style: 'dancer',
    archetype: 'Danseuse',
    stats: st(LEGER, { weight: 85, airJumps: 1 }),
    specials: {
      nspecial: S.shoot('super', 'projecteur', 12, 40),
      sspecial: S.spin('sspecial', 'sp_pirouette', 7),
      uspecial: S.rising('sp_pole_spin', { spin: true }),
      dspecial: S.spin('dspecial', 'sp_pirouette'),
    },
  },
  {
    id: 'roro',
    style: 'padel',
    archetype: 'Raquette',
    stats: st(MOYEN),
    specials: {
      nspecial: S.shoot('sp_racket_drive', 'balle_padel'),
      sspecial: S.dash('sp_racket_drive'),
      uspecial: S.rising('sp_racket_smash'),
      dspecial: S.reflector('sp_racket_smash'),
    },
  },
  {
    id: 'indianne',
    style: 'yogi',
    archetype: 'Yogi',
    stats: st(FLOTTANT),
    specials: {
      nspecial: S.shoot('sp_mudra', 'esprit', 14, 44),
      sspecial: S.shoot('sp_mudra', 'mandala', 14, 46),
      uspecial: S.levitate('sp_levitate'),
      dspecial: S.burst('sp_levitate'),
    },
  },
  {
    id: 'tom',
    style: 'drunken',
    archetype: 'Imprévisible',
    stats: st(MOYEN, { weight: 104, gravity: 0.68 }),
    specials: {
      nspecial: S.shoot('sp_lob_throw', 'biere'),
      sspecial: S.spin('sspecial', 'sp_spin_kick', 6),
      uspecial: S.rising('uppercut'),
      dspecial: S.sway('sp_sway'),
    },
  },
  {
    id: 'roulian',
    style: 'lazy',
    archetype: 'Flemmard',
    stats: st(LOURD, { weight: 106, power: 1.12, run: 7.2 }),
    specials: {
      nspecial: S.shoot('sp_ball_kick', 'ballon', 12, 42),
      sspecial: S.dash('sp_nonchalant', { dmg: 13 }),
      uspecial: S.rising('uppercut'),
      dspecial: S.slam('crouch_punch'),
      dspecial_air: S.slamAir('jump_kick'),
    },
  },
  {
    id: 'mar-1',
    style: 'hockey',
    archetype: 'Hockeyeur',
    stats: st(LEGER, { weight: 90, size: 0.86 }),
    specials: {
      nspecial: S.shoot('sp_slapshot', 'palet'),
      sspecial: S.dash('sp_body_check', { dmg: 12 }),
      uspecial: S.rising('uppercut', { lift: 20 }),
      dspecial: S.flurry('sp_hockey_fight'),
    },
  },
];

export const fighterDef = (id: string): FighterDef => ROSTER.find((d) => d.id === id) ?? ROSTER[0]!;
