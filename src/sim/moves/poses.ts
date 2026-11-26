/* Les poses (images de la banque) qu'un coup peut afficher. Une pose absente chez un personnage est
   remplacée au rendu par sa pose de repli (voir render/sprites). */

export const POSES_COMMUNES = [
  'idle',
  'walk1',
  'walk2',
  'crouch',
  'jump',
  'block',
  'punch_light',
  'punch_heavy',
  'kick_light',
  'kick_heavy',
  'crouch_punch',
  'crouch_kick',
  'uppercut',
  'jump_punch',
  'jump_kick',
  'super',
  'hit',
  'fall',
  'down',
  'win',
  'intro',
] as const;

export const POSES_SPECIALES = [
  'sp_energy_cast',
  'sp_rising_uppercut',
  'sp_ground_slam',
  'sp_shoulder_charge',
  'sp_dash_punch',
  'sp_hook_lunge',
  'sp_slapshot',
  'sp_body_check',
  'sp_hockey_fight',
  'sp_rising_spin',
  'sp_slide',
  'sp_burst',
  'sp_counter_stance',
  'sp_palm_strike',
  'sp_call_pet',
  'sp_signal_jump',
  'sp_pirouette',
  'sp_pole_spin',
  'sp_racket_drive',
  'sp_racket_smash',
  'sp_levitate',
  'sp_mudra',
  'sp_sway',
  'sp_lob_throw',
  'sp_spin_kick',
  'sp_ball_kick',
  'sp_nonchalant',
] as const;

export type PoseCommune = (typeof POSES_COMMUNES)[number];
export type PoseSpeciale = (typeof POSES_SPECIALES)[number];
export type PoseKey = PoseCommune | PoseSpeciale;
