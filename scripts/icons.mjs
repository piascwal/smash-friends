/* Icônes de l'application (écran d'accueil du téléphone), faites à partir des portraits de la banque :
   public/icons/ n'est pas versionné, il est refait par `npm run sprites`. */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;
const CHARS = join(ROOT, 'public', 'assets', 'characters');
const OUT = join(ROOT, 'public', 'icons');

/** Fond nuit, deux portraits qui s'affrontent, barre « smash » rouge en diagonale. */
function background(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><radialGradient id="g" cx="50%" cy="45%" r="70%">
      <stop offset="0" stop-color="#ffcf3f"/><stop offset="0.35" stop-color="#e8402a"/><stop offset="1" stop-color="#160c2c"/>
    </radialGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
  </svg>`;
  return Buffer.from(svg);
}

async function face(id, size, flip) {
  let img = sharp(join(CHARS, id, 'portrait.webp')).resize(size, size, { fit: 'cover', position: 'top' });
  if (flip) img = img.flop();
  return img.png().toBuffer();
}

async function icon(size, name, inset) {
  const inner = size - 2 * inset;
  const half = Math.round(inner * 0.62);
  const left = await face('mat', half, false);
  const right = await face('elo', half, true);
  await sharp(background(size))
    .composite([
      { input: left, left: inset, top: size - inset - half },
      { input: right, left: size - inset - half, top: inset },
    ])
    .png()
    .toFile(join(OUT, name));
}

export async function makeIcons() {
  mkdirSync(OUT, { recursive: true });
  await icon(192, 'icon-192.png', 10);
  await icon(512, 'icon-512.png', 24);
  // « maskable » : le système peut rogner jusqu'à 20 % du bord
  await icon(512, 'maskable-512.png', 100);
  await icon(180, 'apple-touch-icon.png', 10);
  await icon(64, 'favicon.png', 3);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) await makeIcons();
