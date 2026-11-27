/* Menu principal : grandes tuiles inclinées. */
import type { Screen } from '../../app/screen';
import { h } from '../dom';

export interface MenuActions {
  fight(): void;
  training(): void;
  lan(): void;
  controls(): void;
  options(): void;
  back(): void;
}

function tile(cls: string, title: string, sub: string, onclick: () => void, autofocus = false): HTMLElement {
  return h(
    `button.tile.${cls}`,
    { 'data-nav': true, 'data-autofocus': autofocus, onclick },
    h('span.tile-title', {}, title),
    h('span.tile-sub', {}, sub),
  );
}

export function menuScreen(a: MenuActions): Screen {
  const el = h(
    'div.screen.menu-screen',
    {},
    h('div.menu-head', {}, h('span.logo-mini', {}, 'SMASH FRIENDS')),
    h(
      'div.tiles',
      {},
      tile('t-fight', 'COMBAT', 'Seul contre l’IA ou entre amis, jusqu’à 4', a.fight, true),
      tile('t-training', 'ENTRAÎNEMENT', 'Tester un personnage contre un mannequin', a.training),
      tile('t-lan', 'RÉSEAU LOCAL', 'Chacun son téléphone, même Wi-Fi', a.lan),
      tile('t-controls', 'COMMANDES', 'Clavier, manette, tactile', a.controls),
      tile('t-options', 'OPTIONS', 'Son, voix, secousses', a.options),
    ),
  );
  return { el, back: a.back };
}
