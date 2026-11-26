/* Un invité : cherche les parties annoncées sur le Wi-Fi, s'y connecte, envoie ses commandes et
   reçoit les instantanés de l'hôte. */
import { Annuaire, Liaison, Veille, salonsDuReseau, type Annonce, type Signal } from '@piascwal/lan-kit';
import { CONTROLS_BYTES, encodeControls, type Controls } from '../sim/core/input';
import { APP, readHostMessage, validateAnnounce, type Announce, type HostMessage } from './protocol';
import { decodeSnapshot, type Snapshot } from './snapshot';

export type Game = Annonce<Announce>;

export class LanGuest {
  readonly games = new Map<string, Game>();
  onGames: () => void = () => {};
  onMessage: (m: HostMessage) => void = () => {};
  onSnapshot: (s: Snapshot) => void = () => {};
  onClosed: () => void = () => {};
  private link: Liaison | null = null;
  private watch: Veille | null = null;
  private answer: ((s: Signal) => void) | null = null;
  private readonly buf = new ArrayBuffer(CONTROLS_BYTES);

  private constructor(
    private readonly dir: Annuaire<Announce>,
    private readonly ips: string[],
  ) {}

  static async search(): Promise<LanGuest> {
    const { salons, ipsPubliques } = await salonsDuReseau(APP);
    const dir = new Annuaire<Announce>({ app: APP, salons, valideContenu: validateAnnounce });
    await dir.ouvre();
    const g = new LanGuest(dir, ipsPubliques);
    dir.onAnnonce = (a) => {
      g.games.set(a.id, a);
      g.onGames();
    };
    dir.onRetrait = (id) => {
      g.games.delete(id);
      g.onGames();
    };
    dir.onSignal = (_from, _salon, sig) => g.answer?.(sig);
    dir.ecouteAnnonces();
    return g;
  }

  /** Rejoint une partie ; lève une erreur si l'hôte refuse ou si la liaison échoue. */
  async join(game: Game, name: string, charId: string): Promise<void> {
    const link = new Liaison(true, this.ips);
    const sdp = await link.creeOffre();
    const reply = new Promise<Signal>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('pas de réponse')), 12_000);
      this.answer = (s) => {
        clearTimeout(t);
        resolve(s);
      };
    });
    await this.dir.signale(game.id, game.salon, { type: 'offre', sdp, nom: name, spect: false });
    const r = await reply;
    this.answer = null;
    if (r.type !== 'reponse') {
      link.ferme();
      throw new Error(r.type === 'refus' ? 'complet' : 'refus');
    }
    await link.accepteReponse(r.sdp);
    await link.ouverte();
    this.bind(link);
    link.envoieCtrl({ t: 'hello', name, charId });
  }

  private bind(link: Liaison): void {
    this.link = link;
    this.watch = new Veille(link, () => link.ferme());
    link.onCtrl = (o) => {
      if (this.watch!.recu(o as { t: string })) return;
      const m = readHostMessage(o);
      if (m) this.onMessage(m);
    };
    link.onJeu = (data) => {
      this.watch!.recuJeu();
      const s = decodeSnapshot(data);
      if (s) this.onSnapshot(s);
    };
    link.onFerme = () => {
      this.watch?.arrete();
      this.onClosed();
    };
  }

  pick(charId: string): void {
    this.link?.envoieCtrl({ t: 'pick', charId });
  }

  sendControls(c: Controls): void {
    encodeControls(c, new DataView(this.buf), 0);
    this.link?.envoieJeu(this.buf.slice(0));
  }

  get latency(): number | null {
    return this.watch?.latenceMs ?? null;
  }

  close(): void {
    this.watch?.arrete();
    this.link?.ferme();
    this.dir.ferme();
  }
}
