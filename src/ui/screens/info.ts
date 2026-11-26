/* Écrans d'information : commandes, et options. */
import type { Screen } from '../../app/screen';
import { prefs, savePrefs } from '../../app/prefs';
import { setVolume } from '../../audio/synth';
import { h } from '../dom';
import { focusFirst } from '../nav';

const kbd = (k: string) => h('kbd', {}, k);

function table(title: string, rows: [string, string][]): HTMLElement {
  return h(
    'div.panel.ctrl-table',
    {},
    h('h2', {}, title),
    ...rows.map(([a, b]) => h('div.ctrl-row', {}, h('span', {}, a), kbd(b))),
  );
}

export function controlsScreen(onBack: () => void): Screen {
  const el = h(
    'div.screen.info-screen',
    {},
    h(
      'div.select-head',
      {},
      h('button.back', { 'data-nav': true, 'data-autofocus': true, onclick: onBack }, '◀'),
      h('h1', {}, 'COMMANDES'),
    ),
    h(
      'div.ctrl-grid',
      {},
      table('Clavier gauche', [
        ['Bouger', 'Z Q S D'],
        ['Attaque', 'F'],
        ['Spécial', 'G'],
        ['Saut', 'Espace'],
        ['Bouclier', 'Maj gauche'],
      ]),
      table('Clavier droite', [
        ['Bouger', 'Flèches'],
        ['Attaque', 'J'],
        ['Spécial', 'K'],
        ['Saut', 'I'],
        ['Bouclier', 'L'],
      ]),
      table('Manette et tactile', [
        ['Bouger', 'Stick'],
        ['Saut', 'Stick vers le haut'],
        ['Attaque', 'A'],
        ['Spécial', 'B'],
        ['Bouclier', 'Gâchettes / GARDE'],
        ['Smash direct', 'Stick droit'],
        ['Pause', 'Start / II'],
      ]),
      table('Astuces', [
        ['Smash', 'Direction + A tenu, puis lâcher'],
        ['Coup rapide', 'Direction + A bref'],
        ['Récupération', 'Bouclier juste avant le sol'],
        ['L-cancel', 'Bouclier juste avant d’atterrir'],
        ['Ramasser', 'A près d’un objet'],
        ['Lancer l’objet', 'B'],
        ['Rebord', 'Il s’attrape tout seul'],
      ]),
    ),
  );
  setTimeout(() => focusFirst(el));
  return { el, back: onBack };
}

function toggle(label: string, get: () => boolean, set: (v: boolean) => void): HTMLElement {
  const b = h('button.btn.toggle', { 'data-nav': true });
  const paint = () => (b.textContent = `${label} : ${get() ? 'OUI' : 'NON'}`);
  b.addEventListener('click', () => {
    set(!get());
    savePrefs();
    paint();
  });
  paint();
  return b;
}

export function optionsScreen(onBack: () => void): Screen {
  const vol = h('button.btn', { 'data-nav': true });
  const paintVol = () => (vol.textContent = `Volume : ${Math.round(prefs.volume * 10)}/10`);
  vol.addEventListener('click', () => {
    prefs.volume = prefs.volume >= 1 ? 0 : Math.round((prefs.volume + 0.2) * 10) / 10;
    setVolume(prefs.volume);
    savePrefs();
    paintVol();
  });
  paintVol();
  const el = h(
    'div.screen.info-screen',
    {},
    h(
      'div.select-head',
      {},
      h('button.back', { 'data-nav': true, onclick: onBack }, '◀'),
      h('h1', {}, 'OPTIONS'),
    ),
    h(
      'div.panel.options',
      {},
      vol,
      toggle(
        'Voix de l’annonceur',
        () => prefs.voice,
        (v) => (prefs.voice = v),
      ),
      toggle(
        'Secousses de l’écran',
        () => prefs.shake,
        (v) => (prefs.shake = v),
      ),
      toggle(
        'Ralenti du coup fatal',
        () => prefs.cinematic,
        (v) => (prefs.cinematic = v),
      ),
    ),
  );
  setTimeout(() => focusFirst(el));
  return { el, back: onBack };
}
