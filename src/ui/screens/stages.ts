/* Choix du stage : vignette du décor, plan des plateformes, nom ; ou le hasard. */
import type { Screen } from '../../app/screen';
import { backdropUrl } from '../../assets/loader';
import { STAGES } from '../../sim/stage/stages';
import type { StageDef } from '../../sim/stage/types';
import { h } from '../dom';
import { focusFirst } from '../nav';

/** Petit plan du stage : plateformes et zones d'éjection. */
function layoutSvg(s: StageDef): string {
  const b = s.blast;
  const w = b.right - b.left;
  const hh = b.bottom - b.top;
  const rects = s.platforms
    .map((p) => {
      const color = p.solid ? s.theme.top : s.theme.glow;
      const height = p.solid ? p.h : 18;
      return `<rect x="${p.x - b.left}" y="${p.y - b.top}" width="${p.w}" height="${height}" rx="6" fill="${color}"/>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${w} ${hh}" preserveAspectRatio="xMidYMid meet">${rects}</svg>`;
}

export function stagesScreen(current: string, onPick: (id: string) => void, onBack: () => void): Screen {
  const card = (id: string, name: string, sub: string, img: string | null, svg: string) =>
    h(
      `button.stage-card${id === current ? '.current' : ''}`,
      { 'data-nav': true, 'data-autofocus': id === current, onclick: () => onPick(id) },
      img ? h('img', { src: img, alt: '', loading: 'lazy' }) : h('div.stage-random', {}, '?'),
      h('div.stage-layout', { html: svg }),
      h('div.stage-name', {}, name),
      h('div.stage-sub', {}, sub),
    );
  const el = h(
    'div.screen.stages-screen',
    {},
    h(
      'div.select-head',
      {},
      h('button.back', { 'data-nav': true, onclick: onBack }, '◀'),
      h('h1', {}, 'CHOISIS LE STAGE'),
    ),
    h(
      'div.stage-grid',
      {},
      ...STAGES.map((s) => card(s.id, s.name, s.subtitle, backdropUrl(s.backdrop), layoutSvg(s))),
      card('random', 'HASARD', 'Un stage au hasard', null, ''),
    ),
  );
  setTimeout(() => focusFirst(el));
  return { el, back: onBack };
}
