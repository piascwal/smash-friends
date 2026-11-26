/* Point d'entrée : polices, styles, application installable, puis l'écran titre. */
import '@fontsource/bungee/400.css';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './style.css';
import { App } from './app/app';
import { setupPwa } from './app/pwa';

setupPwa();
const app = new App(document.getElementById('ui')!, document.getElementById('game') as HTMLCanvasElement);
app.title();
