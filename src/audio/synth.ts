/* Synthèse de sons (WebAudio) : pas de fichiers, tout est généré. Briques : bruit filtré, oscillateur
   avec glissement de fréquence, enveloppe. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let volume = 0.7;

export function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = volume;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

export function setVolume(v: number): void {
  volume = v;
  if (master) master.gain.value = v;
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

export interface ToneOptions {
  type?: OscillatorType;
  from: number;
  to?: number;
  dur: number;
  gain?: number;
  delay?: number;
}

export function tone(o: ToneOptions): void {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + (o.delay ?? 0);
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.from, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + o.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(a.out);
  osc.start(t);
  osc.stop(t + o.dur + 0.05);
}

export interface NoiseOptions {
  dur: number;
  freq: number;
  to?: number;
  q?: number;
  gain?: number;
  type?: BiquadFilterType;
  delay?: number;
}

export function hiss(o: NoiseOptions): void {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + (o.delay ?? 0);
  const src = a.ctx.createBufferSource();
  src.buffer = noise(a.ctx);
  src.loop = true;
  const f = a.ctx.createBiquadFilter();
  f.type = o.type ?? 'bandpass';
  f.frequency.setValueAtTime(o.freq, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  f.Q.value = o.q ?? 1;
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f).connect(g).connect(a.out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + o.dur + 0.05);
}
