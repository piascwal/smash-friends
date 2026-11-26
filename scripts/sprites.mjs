/* Récupère les images de la banque de sprites (sprite-bank) dans public/assets/ :
   - trouve la version voulue (sprites.json : « v2 » = la plus récente des v2.x, ou une version exacte),
   - télécharge cette version, puis copie les seules images dont le jeu a besoin (needs.json).
   Les besoins viennent du jeu lui-même (needs.json), ce qui permet de construire avant que la banque
   ait reçu la dernière copie de nos besoins (games/smash-friends.json, publiée par `npm run needs`).
   Pour travailler sur une copie locale de la banque : npm run sprites -- --local ../sprite-bank */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('..', import.meta.url).pathname;
const config = JSON.parse(readFileSync(join(ROOT, 'sprites.json'), 'utf8'));
const needs = JSON.parse(readFileSync(join(ROOT, 'needs.json'), 'utf8'));
const DEST = join(ROOT, 'public', 'assets');

/** Le tag le plus récent qui correspond à la version demandée (« v2 » → v2.12). */
function resolveTag(repo, version) {
  if (/^v\d+\.\d+$/.test(version)) return version;
  const out = execFileSync('git', ['ls-remote', '--tags', repo], { encoding: 'utf8' });
  const tags = [...out.matchAll(/refs\/tags\/(v(\d+)\.(\d+))$/gm)]
    .filter((m) => `v${m[2]}` === version)
    .sort((a, b) => Number(a[3]) - Number(b[3]));
  if (!tags.length) throw new Error(`Aucune version ${version} dans ${repo}`);
  return tags.at(-1)[1];
}

/** Télécharge et décompresse une version de la banque ; renvoie son dossier. */
function download(repo, tag) {
  const dir = mkdtempSync(join(tmpdir(), 'sprite-bank-'));
  const [, owner, name] = repo.match(/github\.com\/([^/]+)\/([^/.]+)/);
  const url = `https://codeload.github.com/${owner}/${name}/tar.gz/refs/tags/${tag}`;
  execFileSync('sh', ['-c', `curl -fsSL "${url}" | tar -xz -C "${dir}" --strip-components=1`], {
    stdio: 'inherit',
  });
  return dir;
}

const args = process.argv.slice(2);
const localIndex = args.indexOf('--local');
let bank;
let label;
if (localIndex >= 0) {
  bank = args[localIndex + 1];
  label = `copie locale ${bank}`;
} else {
  const tag = resolveTag(config.repo, config.version);
  bank = download(config.repo, tag);
  label = tag;
}
if (!existsSync(join(bank, 'scripts', 'copy-for-game.mjs'))) throw new Error(`Banque introuvable : ${bank}`);

const copy = await import(pathToFileURL(join(bank, 'scripts', 'copy-for-game.mjs')).href);
mkdirSync(DEST, { recursive: true });
const chars = copy.copyForNeeds(needs, join(DEST, 'characters'));
const props = copy.copyPropsForNeeds(needs, join(DEST, 'props'));
writeFileSync(join(DEST, 'version.json'), `${JSON.stringify({ bank: label }, null, 2)}\n`);
console.log(
  `Banque ${label} : ${chars.characters} personnages (${chars.copied} images), ` +
    `${props.props} objets (${props.copied})`,
);
if (localIndex < 0) rmSync(bank, { recursive: true, force: true });

// icônes de l'application, à partir du portrait du lanceur
const { makeIcons } = await import('./icons.mjs');
await makeIcons();
console.log('Icônes de l’application : public/icons/');
