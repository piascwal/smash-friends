/* Publie nos besoins dans une copie de la banque de sprites : games/smash-friends.json.
   Usage : npm run needs -- ../sprite-bank   (puis committer la banque). */
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const bank = process.argv[2];
if (!bank || !existsSync(join(bank, 'games')))
  throw new Error('Usage : npm run needs -- <dossier de sprite-bank>');
const root = new URL('..', import.meta.url).pathname;
copyFileSync(join(root, 'needs.json'), join(bank, 'games', 'smash-friends.json'));
console.log(`Besoins publiés dans ${join(bank, 'games', 'smash-friends.json')}`);
