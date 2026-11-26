/* Chargement des images copiées depuis la banque (public/assets/, voir scripts/sprites.mjs) :
   fiches et poses des personnages, objets de décor, décors de fond. */

const BASE = './assets';

export interface SpriteImage {
  img: HTMLImageElement;
  w: number;
  h: number;
  adj: { s: number; dx: number; dy: number };
}

export interface CharacterInfo {
  id: string;
  name: string;
  color: string;
  style: string;
  title?: string;
  quote?: string;
  files: Record<string, string>;
  adjust?: Record<string, { s: number; dx: number; dy: number }>;
}

export interface CharacterAssets {
  info: CharacterInfo;
  sprites: Map<string, SpriteImage>;
}

const images = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  let p = images.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`image introuvable : ${url}`));
      img.src = url;
    });
    images.set(url, p);
  }
  return p;
}

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fichier introuvable : ${url}`);
  return (await r.json()) as T;
}

let index: Promise<string[]> | null = null;
const infos = new Map<string, Promise<CharacterInfo>>();
const characters = new Map<string, Promise<CharacterAssets>>();

/** Les personnages de la banque, dans l'ordre d'affichage. */
export const characterIds = (): Promise<string[]> =>
  (index ??= json<string[]>(`${BASE}/characters/index.json`));

export function characterInfo(id: string): Promise<CharacterInfo> {
  let p = infos.get(id);
  if (!p) infos.set(id, (p = json<CharacterInfo>(`${BASE}/characters/${id}/character.json`)));
  return p;
}

export const portraitUrl = (info: CharacterInfo): string =>
  `${BASE}/characters/${info.id}/${info.files.portrait ?? info.files.idle}`;

export const backdropUrl = (charId: string): string => `${BASE}/characters/${charId}/stage.webp`;

/** Toutes les poses d'un personnage (les images manquantes sont simplement absentes). */
export function loadCharacter(id: string): Promise<CharacterAssets> {
  let p = characters.get(id);
  if (!p) {
    p = (async () => {
      const info = await characterInfo(id);
      const sprites = new Map<string, SpriteImage>();
      const entries = Object.entries(info.files).filter(([k]) => k !== 'stage');
      await Promise.all(
        entries.map(async ([pose, file]) => {
          try {
            const img = await loadImage(`${BASE}/characters/${id}/${file}`);
            const adj = info.adjust?.[pose] ?? { s: 1, dx: 0, dy: 0 };
            sprites.set(pose, { img, w: img.naturalWidth, h: img.naturalHeight, adj });
          } catch {
            // pose illisible : la pose de repli prendra le relais
          }
        }),
      );
      return { info, sprites };
    })();
    characters.set(id, p);
  }
  return p;
}

export const loadProp = (id: string): Promise<HTMLImageElement> => loadImage(`${BASE}/props/${id}/image.png`);

/** Image de projectile d'un personnage (pose « pj_ » de la banque), si elle existe. */
export async function loadProjectileImage(charId: string, pose: string): Promise<HTMLImageElement | null> {
  const info = await characterInfo(charId);
  const file = info.files[pose];
  if (!file) return null;
  try {
    return await loadImage(`${BASE}/characters/${charId}/${file}`);
  } catch {
    return null;
  }
}
