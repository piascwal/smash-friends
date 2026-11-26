/* Le clavier, en deux moitiés pour jouer à deux sur un même clavier (touches physiques : le schéma
   marche en AZERTY comme en QWERTY). Seul, on peut utiliser l'une ou l'autre. */
import { BUTTONS, type Button, type Controls } from '../sim/core/input';
import type { Device } from './device';

const down = new Set<string>();
let listening = false;

function listen(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('keydown', (e) => {
    down.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => down.delete(e.code));
  window.addEventListener('blur', () => down.clear());
}

export interface KeyScheme {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  buttons: Record<Exclude<Button, 'pause'>, string[]>;
}

export const LEFT_KEYS: KeyScheme = {
  up: ['KeyW'],
  down: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  buttons: {
    attack: ['KeyF'],
    special: ['KeyG'],
    jump: ['Space'],
    shield: ['ShiftLeft'],
    smash: ['KeyR'],
    grab: ['KeyT'],
  },
};

export const RIGHT_KEYS: KeyScheme = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  buttons: {
    attack: ['KeyJ', 'Numpad1'],
    special: ['KeyK', 'Numpad2'],
    jump: ['KeyI', 'Numpad0'],
    shield: ['KeyL', 'Numpad3'],
    smash: ['KeyU', 'Numpad5'],
    grab: ['KeyO', 'Numpad4'],
  },
};

const any = (codes: string[]) => codes.some((c) => down.has(c));

function readScheme(s: KeyScheme): Controls {
  let buttons = 0;
  for (const [b, codes] of Object.entries(s.buttons)) if (any(codes)) buttons |= BUTTONS[b as Button];
  return {
    x: (any(s.right) ? 1 : 0) - (any(s.left) ? 1 : 0),
    y: (any(s.down) ? 1 : 0) - (any(s.up) ? 1 : 0),
    cx: 0,
    cy: 0,
    buttons,
  };
}

function merge(a: Controls, b: Controls): Controls {
  const pick = (u: number, v: number) => (Math.abs(u) >= Math.abs(v) ? u : v);
  return { x: pick(a.x, b.x), y: pick(a.y, b.y), cx: 0, cy: 0, buttons: a.buttons | b.buttons };
}

export class KeyboardDevice implements Device {
  readonly tapJump = false;

  constructor(
    readonly id: 'clavier' | 'clavier-g' | 'clavier-d',
    readonly label: string,
  ) {
    listen();
  }

  read(): Controls {
    if (this.id === 'clavier-g') return readScheme(LEFT_KEYS);
    if (this.id === 'clavier-d') return readScheme(RIGHT_KEYS);
    return merge(readScheme(LEFT_KEYS), readScheme(RIGHT_KEYS));
  }
}

export const keyDown = (code: string): boolean => down.has(code);
export const startKeyboard = listen;
