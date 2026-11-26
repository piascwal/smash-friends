import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// base relative : le jeu marche aussi bien à la racine que dans un sous-dossier (GitHub Pages)
export default defineConfig({
  base: './',
  resolve: { alias: { '@sim': fileURLToPath(new URL('./src/sim', import.meta.url)) } },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
