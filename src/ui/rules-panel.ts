/* Le panneau des règles : vies ou temps, chacun pour soi ou équipes, objets, tirs amis. */
import type { Rules } from '../app/setup';
import type { ItemFrequency } from '../sim/items/spawner';
import { h } from './dom';

const ITEMS: { v: ItemFrequency; label: string }[] = [
  { v: 'off', label: 'Aucun' },
  { v: 'low', label: 'Peu' },
  { v: 'mid', label: 'Normal' },
  { v: 'high', label: 'Beaucoup' },
];

export function rulesSummary(r: Rules): string {
  const win = r.mode === 'stock' ? `${r.stocks} vie${r.stocks > 1 ? 's' : ''}` : `${r.minutes} min`;
  const items = ITEMS.find((i) => i.v === r.items)!.label.toLowerCase();
  return `${r.teams ? 'Équipes' : 'Chacun pour soi'} · ${win} · objets : ${items}`;
}

function row(label: string, value: string, change: (d: number) => void): HTMLElement {
  return h(
    'div.rule-row',
    {},
    h('span.rule-label', {}, label),
    h('button.mini', { 'data-nav': true, onclick: () => change(-1) }, '◀'),
    h('span.rule-value', {}, value),
    h('button.mini', { 'data-nav': true, onclick: () => change(1) }, '▶'),
  );
}

export function rulesPanel(r: Rules, onChange: () => void, onClose: () => void): HTMLElement {
  const body = h('div.rules-body');
  const render = () => {
    body.replaceChildren(
      row('Mode', r.teams ? 'Équipes' : 'Chacun pour soi', () => {
        r.teams = !r.teams;
        update();
      }),
      row('Victoire', r.mode === 'stock' ? 'Aux vies' : 'Au temps', () => {
        r.mode = r.mode === 'stock' ? 'time' : 'stock';
        update();
      }),
      r.mode === 'stock'
        ? row('Vies', String(r.stocks), (d) => {
            r.stocks = Math.max(1, Math.min(99, r.stocks + d));
            update();
          })
        : row('Durée', `${r.minutes} min`, (d) => {
            r.minutes = Math.max(1, Math.min(10, r.minutes + d));
            update();
          }),
      row('Objets', ITEMS.find((i) => i.v === r.items)!.label, (d) => {
        const i = ITEMS.findIndex((x) => x.v === r.items);
        r.items = ITEMS[(i + d + ITEMS.length) % ITEMS.length]!.v;
        update();
      }),
      row('Tirs amis', r.friendlyFire ? 'Oui' : 'Non', () => {
        r.friendlyFire = !r.friendlyFire;
        update();
      }),
    );
  };
  const update = () => {
    const focused = [...body.querySelectorAll('[data-nav]')].indexOf(document.activeElement as Element);
    render();
    onChange();
    (body.querySelectorAll<HTMLElement>('[data-nav]')[focused] ?? null)?.focus();
  };
  render();
  return h(
    'div.modal',
    { onclick: (e: Event) => e.target === e.currentTarget && onClose() },
    h(
      'div.panel.rules-panel',
      {},
      h('h2', {}, 'RÈGLES'),
      body,
      h('button.btn', { 'data-nav': true, onclick: onClose }, 'OK'),
    ),
  );
}
