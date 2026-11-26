/* Fenêtre de choix d'un personnage (salon réseau). */
import { characterIds, characterInfo, portraitUrl } from '../assets/loader';
import { h } from './dom';
import { focusFirst } from './nav';

export function openCharPicker(parent: HTMLElement, onPick: (id: string) => void): void {
  const grid = h('div.char-grid.picker-grid');
  const modal: HTMLElement = h(
    'div.modal',
    { onclick: (e: Event) => e.target === e.currentTarget && modal.remove() },
    h('div.panel.picker', {}, h('h2', {}, 'CHOISIS TON COMBATTANT'), grid),
  );
  parent.append(modal);
  void characterIds().then(async (ids) => {
    for (const id of ids) {
      const info = await characterInfo(id);
      grid.append(
        h(
          'button.char-tile',
          {
            'data-nav': true,
            style: `--c:${info.color}`,
            onclick: () => {
              modal.remove();
              onPick(id);
            },
          },
          h('img', { src: portraitUrl(info), alt: info.name }),
          h('span.char-name', {}, info.name),
        ),
      );
    }
    focusFirst(modal);
  });
}
