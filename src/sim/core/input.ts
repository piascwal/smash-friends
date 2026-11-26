/* Les commandes d'un combattant pour une image : ce que produisent clavier, manette, écran tactile,
   IA ou réseau. La simulation ne connaît que ça. */

export const BUTTONS = {
  attack: 1,
  special: 2,
  jump: 4,
  shield: 8,
  pause: 16,
} as const;

export type Button = keyof typeof BUTTONS;

export interface Controls {
  /** Stick principal, de -1 à 1 ; y vers le bas (comme l'écran) : haut = -1. */
  x: number;
  y: number;
  /** Stick C (smash directionnel), de -1 à 1. */
  cx: number;
  cy: number;
  /** Boutons tenus (masque de BUTTONS). */
  buttons: number;
}

export const NEUTRAL: Readonly<Controls> = Object.freeze({ x: 0, y: 0, cx: 0, cy: 0, buttons: 0 });

export const held = (c: Controls, b: Button): boolean => (c.buttons & BUTTONS[b]) !== 0;

/** Taille d'une commande encodée pour le réseau. */
export const CONTROLS_BYTES = 5;

export function encodeControls(c: Controls, out: DataView, offset: number): void {
  out.setInt8(offset, Math.round(c.x * 127));
  out.setInt8(offset + 1, Math.round(c.y * 127));
  out.setInt8(offset + 2, Math.round(c.cx * 127));
  out.setInt8(offset + 3, Math.round(c.cy * 127));
  out.setUint8(offset + 4, c.buttons & 0x7f);
}

export function decodeControls(v: DataView, offset: number): Controls {
  const axis = (n: number) => Math.max(-1, Math.min(1, n / 127));
  return {
    x: axis(v.getInt8(offset)),
    y: axis(v.getInt8(offset + 1)),
    cx: axis(v.getInt8(offset + 2)),
    cy: axis(v.getInt8(offset + 3)),
    buttons: v.getUint8(offset + 4) & 0x7f,
  };
}
