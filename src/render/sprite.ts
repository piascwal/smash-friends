/* Dessin d'un personnage à partir des images de la banque (une image par pose), pieds posés en (x, y).
   Une pose absente est remplacée par sa pose de repli, adaptée au mieux (écrasée, couchée, basculée). */
import type { CharacterAssets, SpriteImage } from '../assets/loader';
import { POSE_SPECS } from '../assets/poses';

export interface DrawOptions {
  alpha?: number;
  /** Silhouette blanche (impact). */
  flash?: boolean;
  /** Silhouette unie de cette couleur (traînées, lueur de charge). */
  tint?: string;
  sx?: number;
  sy?: number;
  /** Inclinaison en degrés, autour du centre du corps. */
  rot?: number;
  /** Teinte superposée (gel, étoile…) : couleur avec transparence. */
  overlay?: string;
}

/** Les réglages de la banque sont exprimés pour un personnage de 200 px de haut. */
const BANK_HEIGHT = 200;

const tints = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();

/** Silhouette colorée d'une image, préparée une fois (réduite : elle sert aux effets). */
function silhouette(s: SpriteImage, color: string): HTMLCanvasElement {
  let byColor = tints.get(s.img);
  if (!byColor) tints.set(s.img, (byColor = new Map()));
  let c = byColor.get(color);
  if (!c) {
    const k = Math.min(1, 220 / s.h);
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(s.w * k));
    c.height = Math.max(1, Math.round(s.h * k));
    const g = c.getContext('2d')!;
    g.drawImage(s.img, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    byColor.set(color, c);
  }
  return c;
}

export function resolvePose(ch: CharacterAssets, pose: string): { s: SpriteImage; key: string } | null {
  const spec = POSE_SPECS[pose];
  for (const key of [pose, ...(spec?.fb ?? []), 'idle']) {
    const s = ch.sprites.get(key);
    if (s) return { s, key };
  }
  return null;
}

/** Dessine une pose ; `height` : taille d'un personnage debout à l'écran (unités du monde). */
export function drawPose(
  ctx: CanvasRenderingContext2D,
  ch: CharacterAssets,
  pose: string,
  x: number,
  y: number,
  facing: number,
  height: number,
  opt: DrawOptions = {},
): boolean {
  const found = resolvePose(ch, pose);
  if (!found) return false;
  const { s, key } = found;
  const spec = POSE_SPECS[key] ?? POSE_SPECS.idle!;
  const wanted = POSE_SPECS[pose] ?? spec;
  const fit = spec.w ? (spec.w * height) / s.w : ((spec.h ?? 1) * height) / s.h;
  const k = fit * s.adj.s;
  const w = s.w * k;
  const h = s.h * k;
  let sy = opt.sy ?? 1;
  let rot = opt.rot ?? 0;
  let lying = false;
  if (key !== pose) {
    if (wanted.h && spec.h && wanted.h < spec.h * 0.9) sy *= wanted.h / spec.h;
    if (pose === 'down' && key !== 'fall') lying = true;
    if (pose === 'fall' && key !== 'fall') rot -= 55;
  }
  const bank = height / BANK_HEIGHT;
  ctx.save();
  if (opt.alpha !== undefined) ctx.globalAlpha *= opt.alpha;
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.translate(s.adj.dx * bank, s.adj.dy * bank);
  if (lying) {
    ctx.translate(h / 2, -w * 0.5);
    ctx.rotate(-Math.PI / 2);
  } else if (rot) {
    ctx.translate(0, -h / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(0, h / 2);
  }
  ctx.scale(opt.sx ?? 1, sy);
  const left = lying ? -w / 2 : -spec.ax * w;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const color = opt.flash ? '#ffffff' : opt.tint;
  ctx.drawImage(color ? silhouette(s, color) : s.img, left, -h, w, h);
  if (opt.overlay) {
    ctx.globalAlpha *= 0.55;
    ctx.drawImage(silhouette(s, opt.overlay), left, -h, w, h);
  }
  ctx.restore();
  return true;
}
