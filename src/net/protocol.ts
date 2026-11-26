/* Le protocole de Smash Friends sur le réseau local : identité du jeu, annonce de partie, messages du
   salon (canal fiable) ; les commandes et instantanés passent par le canal de jeu (voir snapshot.ts). */
import { TEXTE_SUR, nettoiePseudo, type AppLan, type ValideContenu } from '@piascwal/lan-kit';
import type { Rules } from '../app/setup';
import type { MatchConfig } from '../sim/match/config';
import { ROSTER } from '../sim/roster/characters';

/** À incrémenter à chaque changement incompatible des messages : les versions différentes ne se voient pas. */
export const PROTOCOL_VERSION = 1;
export const APP: AppLan = { id: 'smash-friends', version: PROTOCOL_VERSION };

export interface Announce {
  nom: string;
  joueurs: number;
  enCours: boolean;
}

export const validateAnnounce: ValideContenu<Announce> = (a) => {
  if (typeof a.nom !== 'string' || !TEXTE_SUR.test(a.nom)) return null;
  if (typeof a.joueurs !== 'number' || !Number.isInteger(a.joueurs) || a.joueurs < 1 || a.joueurs > 4)
    return null;
  if (typeof a.enCours !== 'boolean') return null;
  return { nom: a.nom, joueurs: a.joueurs, enCours: a.enCours };
};

export interface LobbySlot {
  kind: 'host' | 'guest' | 'cpu' | 'off';
  name: string;
  charId: string;
  cpu: number;
  team: number;
}

export type HostMessage =
  | { t: 'lobby'; you: number; slots: LobbySlot[]; rules: Rules; stageId: string }
  | { t: 'start'; config: MatchConfig }
  | { t: 'end' }
  | { t: 'bye'; reason: 'complet' | 'ferme' };

export type GuestMessage = { t: 'hello'; name: string; charId: string } | { t: 'pick'; charId: string };

const CHAR_IDS = new Set(ROSTER.map((d) => d.id));
export const validChar = (id: unknown): string => (typeof id === 'string' && CHAR_IDS.has(id) ? id : 'jbg');

/** Valide un message d'invité (tout ce qui vient du réseau est suspect). */
export function readGuestMessage(o: unknown): GuestMessage | null {
  if (!o || typeof o !== 'object') return null;
  const m = o as Record<string, unknown>;
  if (m.t === 'hello' && typeof m.name === 'string')
    return { t: 'hello', name: nettoiePseudo(m.name), charId: validChar(m.charId) };
  if (m.t === 'pick') return { t: 'pick', charId: validChar(m.charId) };
  return null;
}

/** Message de l'hôte : on fait confiance à l'hôte choisi, mais on vérifie la forme. */
export function readHostMessage(o: unknown): HostMessage | null {
  if (!o || typeof o !== 'object') return null;
  const m = o as Record<string, unknown>;
  if (m.t === 'lobby' && Array.isArray(m.slots) && typeof m.you === 'number')
    return m as unknown as HostMessage;
  if (m.t === 'start' && m.config && typeof m.config === 'object') return m as unknown as HostMessage;
  if (m.t === 'end' || m.t === 'bye') return m as unknown as HostMessage;
  return null;
}
