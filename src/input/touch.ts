/* Commandes tactiles (téléphone, tablette) : stick virtuel à gauche (il apparaît sous le pouce) qui
   sert aussi à sauter (vers le haut), et trois boutons à droite : A (coups, smash en tenant avec une
   direction), B (spéciaux, lancer l'objet tenu), garde. */
import { BUTTONS, type Button, type Controls } from '../sim/core/input';
import { prefs } from '../app/prefs';
import type { Device } from './device';

const STICK_RADIUS = 60;

interface TouchButton {
  button: Button;
  label: string;
  cls: string;
}

const LAYOUT: TouchButton[] = [
  { button: 'attack', label: 'A', cls: 'tb-a' },
  { button: 'special', label: 'B', cls: 'tb-b' },
  { button: 'shield', label: 'GARDE', cls: 'tb-shield' },
  { button: 'pause', label: 'II', cls: 'tb-pause' },
];

/** Boutons facultatifs (Options) : saut, et smash (il pousse le stick C dans la direction du stick). */
const JUMP: TouchButton = { button: 'jump', label: 'SAUT', cls: 'tb-jump' };
const SMASH_CLASS = 'tb-smash';

export class TouchDevice implements Device {
  readonly id = 'tactile';
  readonly label = 'Écran tactile';
  readonly tapJump = true;
  private x = 0;
  private y = 0;
  private buttons = 0;
  private stickId: number | null = null;
  private smash = false;
  /** Dernier sens horizontal poussé : le bouton smash frappe de ce côté si le stick est au neutre. */
  private lastX = 1;
  private origin = { x: 0, y: 0 };
  private root: HTMLElement | null = null;
  private knob: HTMLElement | null = null;
  private base: HTMLElement | null = null;

  read(): Controls {
    let cx = 0;
    let cy = 0;
    if (this.smash) {
      const strong = Math.hypot(this.x, this.y) > 0.4;
      cx = strong ? this.x : this.lastX;
      cy = strong ? this.y : 0;
    }
    return { x: this.x, y: this.y, cx, cy, buttons: this.buttons };
  }

  /** Affiche les commandes par-dessus le jeu. */
  show(parent: HTMLElement): void {
    if (this.root) return;
    const root = document.createElement('div');
    root.className = 'touch-controls';
    root.innerHTML = `<div class="touch-zone"></div><div class="touch-stick"><div class="touch-knob"></div></div>`;
    const layout = prefs.touchJump ? [...LAYOUT, JUMP] : LAYOUT;
    for (const b of layout) {
      root.appendChild(
        this.button(b.label, b.cls, (on) => {
          if (on) this.buttons |= BUTTONS[b.button];
          else this.buttons &= ~BUTTONS[b.button];
        }),
      );
    }
    if (prefs.touchSmash) root.appendChild(this.button('SMASH', SMASH_CLASS, (on) => (this.smash = on)));
    parent.appendChild(root);
    this.root = root;
    this.base = root.querySelector('.touch-stick');
    this.knob = root.querySelector('.touch-knob');
    this.bindStick(root.querySelector('.touch-zone')!);
  }

  private button(label: string, cls: string, set: (on: boolean) => void): HTMLElement {
    const el = document.createElement('button');
    el.className = `touch-btn ${cls}`;
    el.textContent = label;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      set(true);
      el.classList.add('on');
      navigator.vibrate?.(8);
    });
    const up = () => {
      set(false);
      el.classList.remove('on');
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return el;
  }

  hide(): void {
    this.root?.remove();
    this.root = null;
    this.x = this.y = this.buttons = 0;
    this.smash = false;
  }

  private bindStick(zone: HTMLElement): void {
    zone.addEventListener('pointerdown', (e) => {
      if (this.stickId !== null) return;
      this.stickId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      this.origin = { x: e.clientX, y: e.clientY };
      this.base!.style.transform = `translate(${e.clientX - STICK_RADIUS}px, ${e.clientY - STICK_RADIUS}px)`;
      this.base!.classList.add('on');
      this.move(e.clientX, e.clientY);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.stickId) this.move(e.clientX, e.clientY);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.x = this.y = 0;
      this.base!.classList.remove('on');
      this.knob!.style.transform = '';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  private move(px: number, py: number): void {
    let dx = px - this.origin.x;
    let dy = py - this.origin.y;
    const d = Math.hypot(dx, dy);
    if (d > STICK_RADIUS) {
      dx = (dx / d) * STICK_RADIUS;
      dy = (dy / d) * STICK_RADIUS;
    }
    this.knob!.style.transform = `translate(${dx}px, ${dy}px)`;
    const nx = dx / STICK_RADIUS;
    const ny = dy / STICK_RADIUS;
    this.x = Math.abs(nx) < 0.18 ? 0 : nx;
    if (Math.abs(nx) > 0.4) this.lastX = Math.sign(nx);
    this.y = Math.abs(ny) < 0.18 ? 0 : ny;
  }
}

export const isTouchScreen = (): boolean => matchMedia('(pointer: coarse)').matches;
