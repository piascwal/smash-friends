/* Résultats : le vainqueur en grand, puis le classement avec éjections, chutes et dégâts. */
import type { Screen } from '../../app/screen';
import type { MatchAssets } from '../../assets/match-assets';
import { SLOT_COLORS, TEAM_COLORS, TEAM_NAMES } from '../../render/colors';
import type { Match } from '../../sim/match/match';
import { h } from '../dom';
import { focusFirst } from '../nav';

export interface ResultActions {
  again(): void;
  characters(): void;
  menu(): void;
}

function imgOf(assets: MatchAssets, slot: number, pose: string): string {
  const ch = assets.fighters.get(slot);
  return (ch?.sprites.get(pose) ?? ch?.sprites.get('idle'))?.img.src ?? '';
}

export function resultsScreen(m: Match, assets: MatchAssets, a: ResultActions): Screen {
  const ranking = m.ranking();
  const teams = m.config.teams;
  const winner = m.fighter(ranking[0]!.slot)!;
  const colorOf = (slot: number) => {
    const p = m.config.players.find((x) => x.slot === slot)!;
    return teams ? TEAM_COLORS[p.team % 4]! : SLOT_COLORS[slot % 4]!;
  };
  const winName = teams
    ? `ÉQUIPE ${TEAM_NAMES[winner.team % 4]!.toUpperCase()}`
    : assets.fighters.get(winner.slot)!.info.name;
  const rows = ranking.map((r) => {
    const f = m.fighter(r.slot)!;
    const p = m.config.players.find((x) => x.slot === r.slot)!;
    return h(
      'div.result-row',
      { style: `--c:${colorOf(r.slot)}` },
      h('span.place', {}, String(r.place)),
      h('img', { src: imgOf(assets, r.slot, 'portrait'), alt: '' }),
      h(
        'span.rname',
        {},
        `${assets.fighters.get(r.slot)!.info.name}`,
        h('small', {}, p.cpu ? ` CPU ${p.cpu}` : ` ${p.name}`),
      ),
      h('span.stat', {}, h('b', {}, String(f.record.kos)), ' éjections'),
      h('span.stat', {}, h('b', {}, String(f.record.falls)), ' chutes'),
      h('span.stat', {}, h('b', {}, String(Math.round(f.record.damageDealt))), ' % infligés'),
    );
  });
  const el = h(
    'div.screen.results-screen',
    { style: `--c:${colorOf(winner.slot)}` },
    h(
      'div.winner',
      {},
      h('img.winner-pose', { src: imgOf(assets, winner.slot, 'win'), alt: '' }),
      h('div.winner-text', {}, h('span', {}, 'VICTOIRE DE'), h('strong', {}, winName)),
    ),
    h('div.result-table', {}, ...rows),
    h(
      'div.result-actions',
      {},
      h('button.btn', { 'data-nav': true, 'data-autofocus': true, onclick: a.again }, 'REJOUER'),
      h('button.btn', { 'data-nav': true, onclick: a.characters }, 'PERSONNAGES'),
      h('button.btn', { 'data-nav': true, onclick: a.menu }, 'MENU'),
    ),
  );
  setTimeout(() => focusFirst(el));
  return { el, back: a.characters };
}
