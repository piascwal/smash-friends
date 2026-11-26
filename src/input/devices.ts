/* L'inventaire des périphériques : claviers, manettes branchées, écran tactile ; et la navigation
   des menus (n'importe quel périphérique). */
import type { Device, NavAction } from './device';
import { NavRepeater } from './device';
import { GamepadDevice, pads, readPad } from './gamepad';
import { KeyboardDevice, keyDown, startKeyboard } from './keyboard';
import { TouchDevice, isTouchScreen } from './touch';

export const keyboardAll = new KeyboardDevice('clavier', 'Clavier');
export const keyboardLeft = new KeyboardDevice('clavier-g', 'Clavier gauche');
export const keyboardRight = new KeyboardDevice('clavier-d', 'Clavier droite');
export const touch = new TouchDevice();
const gamepads = new Map<number, GamepadDevice>();

export function gamepad(index: number): GamepadDevice {
  let g = gamepads.get(index);
  if (!g) gamepads.set(index, (g = new GamepadDevice(index)));
  return g;
}

/** Les périphériques disponibles maintenant. */
export function availableDevices(): Device[] {
  const list: Device[] = [keyboardAll, keyboardLeft, keyboardRight];
  for (const p of pads()) list.push(gamepad(p.index));
  if (isTouchScreen()) list.push(touch);
  return list;
}

export function deviceById(id: string): Device {
  if (id.startsWith('manette-')) return gamepad(Number(id.slice(8)));
  if (id === 'tactile') return touch;
  if (id === 'clavier-g') return keyboardLeft;
  if (id === 'clavier-d') return keyboardRight;
  return keyboardAll;
}

/** Navigation des menus : émet des actions avec l'identifiant du périphérique d'origine. */
export class MenuInput {
  private readonly repeaters = new Map<string, NavRepeater>();
  private keyEmit: ((a: NavAction, from: string) => void) | null = null;

  constructor() {
    startKeyboard();
    window.addEventListener('keydown', (e) => {
      if (e.repeat && !e.code.startsWith('Arrow')) return;
      const a = keyAction(e.code);
      if (a && this.keyEmit) {
        e.preventDefault();
        this.keyEmit(a, e.code.startsWith('Arrow') || RIGHT_CODES.has(e.code) ? 'clavier-d' : 'clavier-g');
      }
    });
  }

  /** À appeler à chaque image : lit les manettes. */
  poll(emit: (a: NavAction, from: string) => void): void {
    this.keyEmit = emit;
    for (const p of pads()) {
      const c = readPad(p);
      const active = new Set<NavAction>();
      if (c.y < -0.6) active.add('up');
      if (c.y > 0.6) active.add('down');
      if (c.x < -0.6) active.add('left');
      if (c.x > 0.6) active.add('right');
      if (p.buttons[0]?.pressed) active.add('ok');
      if (p.buttons[1]?.pressed) active.add('back');
      if (p.buttons[9]?.pressed) active.add('start');
      if (p.buttons[4]?.pressed) active.add('prev');
      if (p.buttons[5]?.pressed) active.add('next');
      const id = `manette-${p.index}`;
      let r = this.repeaters.get(id);
      if (!r) this.repeaters.set(id, (r = new NavRepeater()));
      r.update(active, (a) => emit(a, id));
    }
  }
}

const RIGHT_CODES = new Set(['KeyJ', 'KeyK', 'KeyL', 'Enter', 'Backspace', 'Numpad1', 'Numpad2']);

function keyAction(code: string): NavAction | null {
  switch (code) {
    case 'ArrowUp':
    case 'KeyW':
      return 'up';
    case 'ArrowDown':
    case 'KeyS':
      return 'down';
    case 'ArrowLeft':
    case 'KeyA':
      return 'left';
    case 'ArrowRight':
    case 'KeyD':
      return 'right';
    case 'Enter':
    case 'KeyF':
    case 'KeyJ':
    case 'Space':
      return 'ok';
    case 'Escape':
    case 'Backspace':
    case 'KeyG':
    case 'KeyK':
      return 'back';
    case 'KeyP':
      return 'start';
    case 'KeyQ':
      return 'prev';
    case 'KeyE':
      return 'next';
    default:
      return null;
  }
}

export const escapePressed = (): boolean => keyDown('Escape') || keyDown('KeyP');
