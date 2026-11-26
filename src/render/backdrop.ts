/* Le décor de fond : l'image de scène d'un personnage de la banque, en léger parallaxe, voilée pour
   faire ressortir les combattants. */
import type { StageDef } from '../sim/stage/types';
import type { Camera } from './camera';

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  stage: StageDef,
  cam: Camera,
  W: number,
  H: number,
): void {
  if (!img) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1040');
    g.addColorStop(1, '#3a1a50');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  // l'image couvre l'écran avec une marge, et glisse un peu avec la caméra (profondeur)
  const cover = Math.max(W / img.naturalWidth, H / img.naturalHeight) * 1.25;
  const w = img.naturalWidth * cover;
  const h = img.naturalHeight * cover;
  const span = stage.camera.right - stage.camera.left;
  const px = (cam.x - (stage.camera.left + stage.camera.right) / 2) / span;
  const py = (cam.y + 200) / (stage.camera.bottom - stage.camera.top);
  const x = (W - w) / 2 - px * (w - W) * 0.9;
  // le sol du décor passe sous le bas de l'écran : le stage flotte devant le paysage
  const y = H - h * 0.97 - py * (h - H) * 0.4;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, x, y, w, h);
  ctx.fillStyle = stage.theme.tint;
  ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}
