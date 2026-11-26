/* Comment afficher chaque pose de la banque : hauteur relative (ou largeur pour les poses couchées),
   point d'ancrage horizontal et poses de repli. Repris du catalogue de la banque de sprites. */

export interface PoseSpec {
  /** Hauteur à l'écran relative à un personnage debout (ou largeur, pour les poses couchées). */
  h?: number;
  w?: number;
  /** Ancrage horizontal des pieds dans l'image (0 = bord arrière, 1 = bord avant). */
  ax: number;
  fb: string[];
}

const P = (h: number, ax: number, fb: string[]): PoseSpec => ({ h, ax, fb });

export const POSE_SPECS: Record<string, PoseSpec> = {
  idle: P(1, 0.5, []),
  walk1: P(1, 0.5, ['idle']),
  walk2: P(1, 0.5, ['walk1', 'idle']),
  crouch: P(0.62, 0.5, ['idle']),
  jump: P(0.9, 0.5, ['idle']),
  block: P(1, 0.5, ['idle']),
  punch_light: P(1, 0.36, ['idle']),
  punch_heavy: P(0.97, 0.34, ['punch_light', 'idle']),
  kick_light: P(1, 0.34, ['punch_light', 'idle']),
  kick_heavy: P(1.02, 0.36, ['kick_light', 'punch_light', 'idle']),
  crouch_punch: P(0.61, 0.38, ['crouch', 'punch_light', 'idle']),
  crouch_kick: P(0.52, 0.3, ['crouch', 'kick_light', 'idle']),
  uppercut: P(1.12, 0.45, ['punch_heavy', 'punch_light', 'idle']),
  jump_punch: P(0.86, 0.42, ['jump_kick', 'jump', 'idle']),
  jump_kick: P(0.86, 0.4, ['jump_punch', 'jump', 'idle']),
  super: P(1, 0.5, ['win', 'idle']),
  hit: P(0.98, 0.5, ['idle']),
  fall: { w: 1, ax: 0.5, fb: ['hit', 'idle'] },
  down: { w: 1.05, ax: 0.5, fb: ['fall', 'hit', 'idle'] },
  win: P(1.12, 0.5, ['idle']),
  intro: P(1, 0.5, ['idle']),
  sp_energy_cast: P(0.95, 0.38, ['punch_heavy', 'idle']),
  sp_rising_uppercut: P(1.1, 0.45, ['uppercut', 'punch_heavy', 'idle']),
  sp_dash_punch: P(0.85, 0.42, ['punch_heavy', 'idle']),
  sp_spin_kick: P(1, 0.42, ['kick_heavy', 'idle']),
  sp_ground_slam: P(0.75, 0.38, ['crouch_punch', 'crouch', 'idle']),
  sp_shoulder_charge: P(0.9, 0.42, ['punch_heavy', 'idle']),
  sp_counter_stance: P(1, 0.4, ['block', 'idle']),
  sp_palm_strike: P(0.95, 0.38, ['punch_heavy', 'idle']),
  sp_rising_spin: P(1.1, 0.42, ['jump_kick', 'kick_heavy', 'idle']),
  sp_slide: P(0.5, 0.3, ['crouch_kick', 'crouch', 'idle']),
  sp_hook_lunge: P(0.85, 0.42, ['punch_heavy', 'idle']),
  sp_sway: P(1, 0.55, ['hit', 'idle']),
  sp_lob_throw: P(0.95, 0.42, ['punch_heavy', 'idle']),
  sp_burst: P(1.05, 0.5, ['super', 'win', 'idle']),
  sp_ball_kick: P(1, 0.42, ['punch_heavy', 'idle']),
  sp_nonchalant: P(1, 0.42, ['punch_heavy', 'idle']),
  sp_slapshot: P(0.9, 0.38, ['punch_heavy', 'idle']),
  sp_body_check: P(0.9, 0.42, ['punch_heavy', 'idle']),
  sp_hockey_fight: P(1, 0.42, ['punch_light', 'idle']),
  sp_call_pet: P(0.97, 0.42, ['punch_heavy', 'idle']),
  sp_signal_jump: P(1.1, 0.45, ['uppercut', 'idle']),
  sp_racket_drive: P(0.95, 0.4, ['punch_heavy', 'idle']),
  sp_racket_smash: P(1.1, 0.45, ['jump_punch', 'uppercut', 'idle']),
  sp_mudra: P(1, 0.45, ['punch_light', 'idle']),
  sp_levitate: P(0.65, 0.5, ['crouch', 'idle']),
  sp_pirouette: P(1.05, 0.5, ['kick_heavy', 'idle']),
  sp_pole_spin: P(1.15, 0.4, ['kick_heavy', 'idle']),
};
