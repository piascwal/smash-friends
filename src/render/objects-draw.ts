/* Dessin des objets (images de la banque, ou dessinés : cœur, étoile) et des projectiles. */
import { projectileKey, type MatchAssets } from '../assets/match-assets';
import type { Item } from '../sim/items/item';
import type { Projectile } from '../sim/projectiles/projectile';

function drawHeart(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = '#ff3a5a';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.6, -r * 1.3, 0, -r * 0.4);
  ctx.bezierCurveTo(r * 0.6, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9);
  ctx.fill();
  ctx.stroke();
}

function drawStarItem(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.fillStyle = `hsl(${(time * 8) % 360},100%,62%)`;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawItem(ctx: CanvasRenderingContext2D, it: Item, assets: MatchAssets, time: number): void {
  if (it.spawning > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(time * 0.5) * 0.3;
    ctx.fillStyle = '#fff6a0';
    ctx.beginPath();
    ctx.arc(it.x, it.y, 6 + (30 - it.spawning) * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  const blink = !it.flying && it.holder < 0 && it.age > it.def.life - 120 && time % 6 < 3;
  if (blink) return;
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate((it.angle * Math.PI) / 180);
  const img = assets.items.get(it.def.id);
  const r = it.def.width / 2;
  if (img) {
    const k = it.def.width / img.naturalWidth;
    ctx.drawImage(img, -r, -img.naturalHeight * k * 0.5, it.def.width, img.naturalHeight * k);
  } else if (it.def.id === 'coeur') drawHeart(ctx, r * 0.8);
  else drawStarItem(ctx, r, time);
  ctx.restore();
}

function drawOrb(ctx: CanvasRenderingContext2D, p: Projectile): void {
  const r = p.def.radius;
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.6);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, p.def.color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawColumn(ctx: CanvasRenderingContext2D, p: Projectile, img: HTMLImageElement | undefined): void {
  const k = Math.min(1, p.age / (p.def.delay ?? 1));
  const w = p.def.width;
  const h = p.def.path === 'column' ? 520 : 150 * k;
  ctx.save();
  ctx.globalAlpha = p.age < (p.def.delay ?? 0) ? 0.35 : 1;
  if (img) ctx.drawImage(img, p.x - w / 2, p.y - h, w, h);
  else {
    ctx.fillStyle = p.def.color;
    ctx.fillRect(p.x - w / 4, p.y - h, w / 2, h);
  }
  ctx.restore();
}

export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  p: Projectile,
  assets: MatchAssets,
  time: number,
): void {
  const pose = p.def.anim ? p.def.anim[Math.floor(time / 6) % p.def.anim.length]! : p.def.image;
  const img = pose ? assets.projectiles.get(projectileKey(p.owner, pose)) : undefined;
  if (p.def.path === 'column' || p.def.path === 'pillar') return drawColumn(ctx, p, img);
  if (!img) return drawOrb(ctx, p);
  const w = p.def.width;
  const h = (img.naturalHeight / img.naturalWidth) * w;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.facing, 1);
  if (p.def.spin) ctx.rotate((time / 60) * p.def.spin * Math.PI * 2);
  // les images de projectiles sont dessinées vers la droite : on les pose centrées
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
