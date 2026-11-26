/* L'hôte d'une partie en réseau local : il annonce sa partie sur le Wi-Fi, accueille jusqu'à trois
   invités, fait tourner la simulation et leur envoie un instantané à chaque image. */
import { Annuaire, Liaison, Limiteur, Veille, salonsDuReseau, type Signal } from '@piascwal/lan-kit';
import type { Rules } from '../app/setup';
import { CONTROLS_BYTES, NEUTRAL, decodeControls, type Controls } from '../sim/core/input';
import type { MatchConfig } from '../sim/match/config';
import {
  APP,
  readGuestMessage,
  validateAnnounce,
  type Announce,
  type HostMessage,
  type LobbySlot,
} from './protocol';

interface Member {
  link: Liaison;
  watch: Veille | null;
  slot: number;
  controls: Controls;
  limit: Limiteur;
}

export class LanHost {
  readonly slots: LobbySlot[];
  rules: Rules;
  stageId = 'random';
  playing = false;
  onChange: () => void = () => {};
  private members: Member[] = [];
  private closed = false;

  private constructor(
    private readonly dir: Annuaire<Announce>,
    private readonly ips: string[],
    name: string,
    charId: string,
    rules: Rules,
  ) {
    this.rules = { ...rules };
    this.slots = [
      { kind: 'host', name, charId, cpu: 0, team: 0 },
      { kind: 'off', name: '', charId: 'jbg', cpu: 3, team: 1 },
      { kind: 'off', name: '', charId: 'lolo', cpu: 3, team: 1 },
      { kind: 'off', name: '', charId: 'elo', cpu: 3, team: 0 },
    ];
  }

  static async create(name: string, charId: string, rules: Rules): Promise<LanHost> {
    const { salons, ipsPubliques } = await salonsDuReseau(APP);
    const dir = new Annuaire<Announce>({
      app: APP,
      salons,
      valideContenu: validateAnnounce,
      testament: true,
    });
    await dir.ouvre();
    const host = new LanHost(dir, ipsPubliques, name, charId, rules);
    dir.onSignal = (from, salon, sig) => void host.onSignal(from, salon, sig);
    host.announce();
    return host;
  }

  get playerCount(): number {
    return this.slots.filter((s) => s.kind !== 'off').length;
  }

  private announce(): void {
    if (this.closed) return;
    const humans = this.slots.filter((s) => s.kind === 'host' || s.kind === 'guest').length;
    this.dir.annonce({ nom: this.slots[0]!.name, joueurs: humans, enCours: this.playing });
  }

  private async onSignal(from: string, salon: number, sig: Signal): Promise<void> {
    if (sig.type !== 'offre' || this.closed) return;
    const slot = this.slots.findIndex((s, i) => i > 0 && s.kind !== 'guest' && s.kind !== 'host');
    if (slot < 0 || this.playing) {
      await this.dir.signale(from, salon, { type: 'refus', raison: 'complet' });
      return;
    }
    const link = new Liaison(true, this.ips);
    try {
      const sdp = await link.accepteOffre(sig.sdp);
      await this.dir.signale(from, salon, { type: 'reponse', sdp });
      await link.ouverte();
    } catch {
      link.ferme();
      return;
    }
    this.welcome(link, slot, sig.nom);
  }

  private welcome(link: Liaison, slot: number, name: string): void {
    const m: Member = { link, watch: null, slot, controls: NEUTRAL, limit: new Limiteur(30, 60) };
    m.watch = new Veille(link, () => link.ferme());
    this.members.push(m);
    Object.assign(this.slots[slot]!, { kind: 'guest', name, cpu: 0 });
    link.onCtrl = (o) => {
      if (m.watch!.recu(o as { t: string })) return;
      if (!m.limit.accepte()) return;
      const msg = readGuestMessage(o);
      if (!msg) return;
      if (msg.t === 'hello') this.slots[slot]!.name = msg.name;
      this.slots[slot]!.charId = msg.charId;
      this.changed();
    };
    link.onJeu = (data) => {
      m.watch!.recuJeu();
      if (data.byteLength >= CONTROLS_BYTES) m.controls = decodeControls(new DataView(data), 0);
    };
    link.onFerme = () => this.leave(m);
    this.changed();
  }

  private leave(m: Member): void {
    m.watch?.arrete();
    this.members = this.members.filter((x) => x !== m);
    const s = this.slots[m.slot]!;
    // en plein combat, l'IA prend le relais ; sinon la place se libère
    Object.assign(s, this.playing ? { kind: 'cpu', cpu: 5 } : { kind: 'off', name: '' });
    this.changed();
  }

  /** Le salon a changé : on prévient tout le monde. */
  changed(): void {
    for (const m of this.members)
      this.send(m, { t: 'lobby', you: m.slot, slots: this.slots, rules: this.rules, stageId: this.stageId });
    this.announce();
    this.onChange();
  }

  private send(m: Member, msg: HostMessage): void {
    m.link.envoieCtrl(msg);
  }

  start(config: MatchConfig): void {
    this.playing = true;
    for (const m of this.members) this.send(m, { t: 'start', config });
    this.announce();
  }

  end(): void {
    this.playing = false;
    for (const m of this.members) this.send(m, { t: 'end' });
    this.announce();
  }

  /** Commandes reçues des invités, par emplacement. */
  remoteInputs(): Map<number, Controls> {
    return new Map(this.members.map((m) => [m.slot, m.controls]));
  }

  broadcast(data: ArrayBuffer): void {
    for (const m of this.members) m.link.envoieJeu(data);
  }

  close(): void {
    this.closed = true;
    for (const m of this.members) {
      this.send(m, { t: 'bye', reason: 'ferme' });
      m.watch?.arrete();
      m.link.ferme();
    }
    this.dir.ferme();
  }
}
