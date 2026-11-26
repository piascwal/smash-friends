/* Morceaux d'interface du salon réseau : liste des places, liste des parties trouvées. */
import { characterInfo, portraitUrl } from '../assets/loader';
import { SLOT_COLORS } from '../render/colors';
import { h } from '../ui/dom';
import type { Game } from './guest';
import type { LobbySlot } from './protocol';

export interface SlotActions {
  /** Changer le personnage de cette place (null : pas le droit). */
  pick: ((slot: number) => void) | null;
  /** Hôte : basculer une place libre entre vide et CPU. */
  cycle: ((slot: number) => void) | null;
}

function label(s: LobbySlot): string {
  if (s.kind === 'off') return 'Place libre';
  if (s.kind === 'cpu') return `CPU niveau ${s.cpu}`;
  return s.name;
}

export function slotRow(s: LobbySlot, i: number, you: number, a: SlotActions): HTMLElement {
  const img = h('img', { alt: '' });
  if (s.kind !== 'off')
    void characterInfo(s.charId).then((info) => img.setAttribute('src', portraitUrl(info)));
  const canPick = a.pick && (i === you || s.kind === 'cpu');
  return h(
    `div.lan-slot${s.kind === 'off' ? '.off' : ''}${i === you ? '.me' : ''}`,
    { style: `--c:${SLOT_COLORS[i]}` },
    h('span.lan-tag', {}, `J${i + 1}`),
    s.kind !== 'off' ? img : h('span.lan-empty', {}, '+'),
    h('span.lan-name', {}, label(s), i === you ? h('small', {}, ' (toi)') : null),
    canPick ? h('button.chip', { 'data-nav': true, onclick: () => a.pick!(i) }, 'Personnage') : null,
    a.cycle && i > 0 && s.kind !== 'guest'
      ? h(
          'button.chip',
          { 'data-nav': true, onclick: () => a.cycle!(i) },
          s.kind === 'off' ? 'Ajouter un CPU' : 'Niveau / retirer',
        )
      : null,
  );
}

export function gameList(games: Game[], join: (g: Game) => void): HTMLElement {
  if (!games.length) return h('p.lan-hint', {}, 'Recherche des parties sur ce Wi-Fi…');
  return h(
    'div.lan-games',
    {},
    ...games.map((g) =>
      h(
        'button.btn.lan-game',
        { 'data-nav': true, disabled: g.enCours || g.joueurs >= 4, onclick: () => join(g) },
        `${g.nom} · ${g.joueurs}/4${g.enCours ? ' · en combat' : ''}`,
      ),
    ),
  );
}
