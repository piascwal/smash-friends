/* Particules (dans le repère du monde) : étincelles, poussière, fumée d'éjection, anneaux de choc,
   flammes, éclats de glace, éclairs, étoiles. */

export type ParticleKind =
  'spark' | 'dust' | 'smoke' | 'ring' | 'flame' | 'shard' | 'bolt' | 'star' | 'glow' | 'line';

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  grow: number;
  gravity: number;
}

export class Particles {
  readonly list: Particle[] = [];

  add(p: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y'>): void {
    if (this.list.length > 900) this.list.shift();
    const max = p.max ?? p.life ?? 30;
    this.list.push({
      vx: 0,
      vy: 0,
      size: 6,
      color: '#fff',
      rot: 0,
      grow: 0,
      gravity: 0,
      ...p,
      life: p.life ?? max,
      max,
    });
  }

  /** Gerbe d'étincelles en étoile autour d'un point. */
  burst(
    x: number,
    y: number,
    n: number,
    speed: number,
    color: string,
    kind: ParticleKind = 'spark',
    life = 18,
  ): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const v = speed * (0.5 + Math.random() * 0.7);
      this.add({
        kind,
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.7 + Math.random() * 0.5),
        size: 3 + Math.random() * 4,
        color,
        rot: a,
      });
    }
  }

  update(): void {
    for (const p of this.list) {
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.94;
      p.vy *= p.kind === 'smoke' || p.kind === 'dust' ? 0.94 : 0.97;
      p.size += p.grow;
    }
    for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i]!.life <= 0) this.list.splice(i, 1);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.list) drawParticle(ctx, p);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const t = p.life / p.max;
  ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.4));
  ctx.fillStyle = p.color;
  ctx.strokeStyle = p.color;
  switch (p.kind) {
    case 'spark':
    case 'line': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = p.size * t + 0.5;
      ctx.beginPath();
      const k = p.kind === 'line' ? 6 : 2.5;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * k, p.y - p.vy * k);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    case 'dust':
    case 'smoke':
      ctx.globalAlpha *= p.kind === 'smoke' ? 0.55 : 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 'ring':
      ctx.lineWidth = Math.max(1, 6 * t);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
      return;
    case 'flame':
    case 'glow':
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      return;
    case 'shard':
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + (1 - t) * 4);
      ctx.fillRect(-p.size / 2, -p.size * 1.5, p.size, p.size * 3);
      ctx.restore();
      return;
    case 'bolt': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let x = p.x;
      let y = p.y;
      ctx.moveTo(x, y);
      for (let i = 0; i < 4; i++) {
        x += Math.cos(p.rot) * p.size + (Math.random() - 0.5) * p.size;
        y += Math.sin(p.rot) * p.size + (Math.random() - 0.5) * p.size;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    case 'star':
      drawStar(ctx, p.x, p.y, p.size, p.rot + (1 - t) * 3);
      return;
  }
}
