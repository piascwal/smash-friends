/* La carte d'un emplacement de joueur, en bas de la sélection : type (joueur, CPU, fermé),
   personnage choisi, niveau de l'IA, équipe, périphérique. */
import { characterInfo, portraitUrl } from '../assets/loader';
import type { SlotSetup } from '../app/setup';
import { CPU_COLOR, SLOT_COLORS, TEAM_COLORS, TEAM_NAMES } from '../render/colors';
import { fighterDef } from '../sim/roster/characters';
import { h } from './dom';

export interface SlotCallbacks {
  cycleKind(): void;
  level(delta: number): void;
  cycleTeam(): void;
  cycleDevice(): void;
  select(): void;
}

export function deviceLabel(id: string): string {
  if (id === 'tactile') return 'Tactile';
  if (id === 'clavier-g') return 'Clavier gauche';
  if (id === 'clavier-d') return 'Clavier droite';
  if (id.startsWith('manette-')) return `Manette ${Number(id.slice(8)) + 1}`;
  return 'Clavier';
}

export function slotColor(index: number, s: SlotSetup, teams: boolean): string {
  if (s.kind === 'off') return '#3a3550';
  if (teams) return TEAM_COLORS[s.team % 4]!;
  return s.kind === 'cpu' ? CPU_COLOR : SLOT_COLORS[index]!;
}

export function slotCard(
  index: number,
  s: SlotSetup,
  teams: boolean,
  active: boolean,
  cb: SlotCallbacks,
): HTMLElement {
  const color = slotColor(index, s, teams);
  const kindLabel = s.kind === 'human' ? `J${index + 1}` : s.kind === 'cpu' ? 'CPU' : 'FERMÉ';
  const art = h('div.slot-art', { onclick: cb.select });
  if (s.kind !== 'off' && s.charId && s.charId !== 'random') {
    void characterInfo(s.charId).then((info) => {
      art.append(h('img', { src: portraitUrl(info), alt: info.name }));
      art.append(h('div.slot-name', {}, info.name), h('div.slot-arch', {}, fighterDef(info.id).archetype));
    });
  } else if (s.kind !== 'off') {
    art.append(h('div.slot-empty', {}, s.charId === 'random' ? '?' : 'CHOISIS'));
  } else art.append(h('div.slot-empty', {}, '+'));
  const controls = h('div.slot-controls');
  if (s.kind === 'cpu') {
    controls.append(
      h('button.mini', { 'data-nav': true, onclick: () => cb.level(-1), 'aria-label': 'Niveau moins' }, '◀'),
      h('span.slot-level', {}, `NIV. ${s.cpu}`),
      h('button.mini', { 'data-nav': true, onclick: () => cb.level(1), 'aria-label': 'Niveau plus' }, '▶'),
    );
  } else if (s.kind === 'human') {
    controls.append(h('button.chip', { 'data-nav': true, onclick: cb.cycleDevice }, deviceLabel(s.device)));
  }
  if (teams && s.kind !== 'off') {
    controls.append(
      h(
        'button.chip.team',
        { 'data-nav': true, onclick: cb.cycleTeam, style: `--team:${TEAM_COLORS[s.team % 4]}` },
        `Équipe ${TEAM_NAMES[s.team % 4]}`,
      ),
    );
  }
  return h(
    `div.slot${active ? '.active' : ''}${s.kind === 'off' ? '.off' : ''}`,
    { style: `--c:${color}` },
    h('button.slot-kind', { 'data-nav': true, onclick: cb.cycleKind }, kindLabel),
    art,
    controls,
  );
}
