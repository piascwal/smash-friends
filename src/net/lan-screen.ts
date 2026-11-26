/* Réseau local : écran provisoire (voir le plan, étape 2). */
import type { App } from '../app/app';
import type { Screen } from '../app/screen';
import { h } from '../ui/dom';

export function lanScreen(app: App): Screen {
  const el = h(
    'div.screen.info-screen',
    {},
    h(
      'div.select-head',
      {},
      h('button.back', { 'data-nav': true, 'data-autofocus': true, onclick: () => app.menu() }, '◀'),
      h('h1', {}, 'RÉSEAU LOCAL'),
    ),
    h('div.panel', {}, h('p', {}, 'Bientôt : chacun son téléphone, sur le même Wi-Fi.')),
  );
  return { el, back: () => app.menu() };
}
