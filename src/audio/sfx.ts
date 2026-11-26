/* Les bruitages du jeu, chacun composé de briques de synthèse. */
import { hiss, tone } from './synth';

export const sfx = {
  hit(strength: number, effect: string): void {
    const s = Math.min(1, strength);
    hiss({ dur: 0.08 + s * 0.12, freq: 1800 - s * 900, q: 0.8, gain: 0.25 + s * 0.35 });
    tone({ type: 'sine', from: 180 - s * 60, to: 50, dur: 0.12 + s * 0.2, gain: 0.35 + s * 0.4 });
    if (effect === 'electric') tone({ type: 'square', from: 120, to: 90, dur: 0.25, gain: 0.12 });
    if (effect === 'fire') hiss({ dur: 0.35, freq: 600, to: 200, type: 'lowpass', gain: 0.25 });
    if (effect === 'ice') tone({ type: 'triangle', from: 2400, to: 1800, dur: 0.2, gain: 0.12 });
    if (effect === 'slash') hiss({ dur: 0.12, freq: 5000, to: 2000, q: 2, gain: 0.25 });
  },
  fatal(): void {
    tone({ type: 'sawtooth', from: 90, to: 30, dur: 0.9, gain: 0.35 });
    hiss({ dur: 0.6, freq: 3000, to: 400, gain: 0.4 });
    tone({ type: 'triangle', from: 1200, to: 1150, dur: 0.6, gain: 0.15, delay: 0.02 });
  },
  ko(): void {
    hiss({ dur: 1.2, freq: 1200, to: 80, type: 'lowpass', gain: 0.7 });
    tone({ type: 'sine', from: 110, to: 28, dur: 1.1, gain: 0.7 });
    tone({ type: 'square', from: 880, to: 220, dur: 0.4, gain: 0.08, delay: 0.05 });
  },
  star(): void {
    for (let i = 0; i < 4; i++)
      tone({ type: 'triangle', from: 1400 + i * 300, dur: 0.12, gain: 0.12, delay: 0.25 + i * 0.07 });
  },
  jump(air: boolean): void {
    tone({ type: 'sine', from: air ? 380 : 260, to: air ? 760 : 520, dur: 0.12, gain: 0.12 });
  },
  land(hard: boolean): void {
    hiss({ dur: hard ? 0.18 : 0.08, freq: 300, type: 'lowpass', gain: hard ? 0.3 : 0.12 });
  },
  dash(): void {
    hiss({ dur: 0.12, freq: 900, to: 300, gain: 0.12 });
  },
  whoosh(heavy: boolean): void {
    hiss({
      dur: heavy ? 0.2 : 0.1,
      freq: heavy ? 700 : 1400,
      to: heavy ? 300 : 800,
      q: 1.4,
      gain: heavy ? 0.18 : 0.1,
    });
  },
  charge(): void {
    tone({ type: 'sawtooth', from: 140, to: 520, dur: 0.6, gain: 0.08 });
  },
  shield(): void {
    tone({ type: 'triangle', from: 900, to: 860, dur: 0.15, gain: 0.18 });
    tone({ type: 'sine', from: 1350, dur: 0.1, gain: 0.08 });
  },
  shieldBreak(): void {
    hiss({ dur: 0.5, freq: 4000, to: 1500, q: 0.7, gain: 0.4 });
    for (let i = 0; i < 5; i++)
      tone({ type: 'triangle', from: 1600 - i * 220, dur: 0.15, gain: 0.12, delay: i * 0.06 });
  },
  item(what: string): void {
    if (what === 'spawn')
      for (let i = 0; i < 3; i++)
        tone({ type: 'sine', from: 1200 + i * 400, dur: 0.1, gain: 0.07, delay: i * 0.05 });
    else if (what === 'heal')
      for (let i = 0; i < 4; i++)
        tone({ type: 'triangle', from: 520 * 1.26 ** i, dur: 0.12, gain: 0.12, delay: i * 0.06 });
    else if (what === 'star')
      for (let i = 0; i < 8; i++)
        tone({ type: 'square', from: 660 * 1.12 ** i, dur: 0.07, gain: 0.06, delay: i * 0.04 });
    else if (what === 'break') hiss({ dur: 0.3, freq: 500, gain: 0.3 });
    else tone({ type: 'sine', from: 600, to: 900, dur: 0.06, gain: 0.08 });
  },
  explosion(): void {
    hiss({ dur: 0.9, freq: 900, to: 60, type: 'lowpass', gain: 0.6 });
    tone({ type: 'sine', from: 90, to: 30, dur: 0.8, gain: 0.5 });
  },
  tech(): void {
    tone({ type: 'triangle', from: 700, to: 1100, dur: 0.08, gain: 0.1 });
  },
  counter(): void {
    tone({ type: 'triangle', from: 1800, to: 2400, dur: 0.25, gain: 0.15 });
    hiss({ dur: 0.2, freq: 6000, q: 3, gain: 0.15 });
  },
  countdown(n: number): void {
    tone({ type: 'square', from: n > 0 ? 440 : 880, dur: n > 0 ? 0.18 : 0.5, gain: 0.12 });
  },
  game(): void {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ type: 'square', from: f, dur: 0.6, gain: 0.07, delay: i * 0.03 }),
    );
  },
  menuMove(): void {
    tone({ type: 'square', from: 900, dur: 0.035, gain: 0.05 });
  },
  menuOk(): void {
    tone({ type: 'square', from: 700, to: 1400, dur: 0.09, gain: 0.08 });
  },
  menuBack(): void {
    tone({ type: 'square', from: 500, to: 250, dur: 0.09, gain: 0.07 });
  },
};

/** Voix d'annonceur (synthèse vocale du navigateur, si disponible). */
export function announce(text: string): void {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 0.9;
    u.pitch = 0.6;
    u.volume = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* pas de synthèse vocale : tant pis */
  }
}
