/* Les manettes (Gamepad API, disposition standard) : stick gauche, stick C pour les smashs,
   A attaque, B spécial, X/Y saut, gâchettes bouclier, RB chope, Start pause. */
import { BUTTONS, type Controls } from '../sim/core/input';
import type { Device } from './device';

const DEAD = 0.22;
const dz = (v: number) => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));

export function pads(): Gamepad[] {
  try {
    return [...(navigator.getGamepads?.() ?? [])].filter((p): p is Gamepad => !!p && p.connected);
  } catch {
    return [];
  }
}

const pressed = (p: Gamepad, i: number) =>
  !!p.buttons[i] && (p.buttons[i]!.pressed || p.buttons[i]!.value > 0.4);

export function readPad(p: Gamepad): Controls {
  let x = dz(p.axes[0] ?? 0);
  let y = dz(p.axes[1] ?? 0);
  if (pressed(p, 14)) x = -1;
  if (pressed(p, 15)) x = 1;
  if (pressed(p, 12)) y = -1;
  if (pressed(p, 13)) y = 1;
  let b = 0;
  if (pressed(p, 0)) b |= BUTTONS.attack;
  if (pressed(p, 1)) b |= BUTTONS.special;
  if (pressed(p, 2) || pressed(p, 3)) b |= BUTTONS.jump;
  if (pressed(p, 4) || pressed(p, 6) || pressed(p, 7)) b |= BUTTONS.shield;
  if (pressed(p, 5)) b |= BUTTONS.grab;
  if (pressed(p, 9)) b |= BUTTONS.pause;
  return { x, y, cx: dz(p.axes[2] ?? 0), cy: dz(p.axes[3] ?? 0), buttons: b };
}

export class GamepadDevice implements Device {
  readonly tapJump = true;
  readonly id: string;
  readonly label: string;

  constructor(readonly index: number) {
    this.id = `manette-${index}`;
    this.label = `Manette ${index + 1}`;
  }

  read(): Controls {
    const p = pads().find((g) => g.index === this.index);
    return p ? readPad(p) : { x: 0, y: 0, cx: 0, cy: 0, buttons: 0 };
  }
}
