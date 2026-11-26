/* Application installable (par le menu du navigateur) : plein écran, paysage, hors ligne. */

/** Lancé depuis l'écran d'accueil (application installée). */
export const isStandalone = () =>
  matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isTouch = () => matchMedia('(pointer: coarse)').matches;

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
type FsDocument = Document & {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
};

export const isFullscreen = () =>
  !!(document.fullscreenElement ?? (document as FsDocument).webkitFullscreenElement);
export const canFullscreen = () =>
  !isStandalone() &&
  !!(
    document.documentElement.requestFullscreen ??
    (document.documentElement as FsElement).webkitRequestFullscreen
  );

/** Plein écran, puis blocage en paysage quand le navigateur le permet. */
export async function enterFullscreen() {
  const el = document.documentElement as FsElement;
  try {
    if (!isFullscreen()) {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else await el.webkitRequestFullscreen?.();
    }
  } catch {
    /* refusé (iPhone, iframe) : le jeu reste jouable */
  }
  lockLandscape();
}

export async function toggleFullscreen() {
  if (isFullscreen()) {
    const d = document as FsDocument;
    await (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.())?.catch(() => {});
  } else await enterFullscreen();
}

function lockLandscape() {
  const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  o?.lock?.('landscape').catch(() => {});
}

/** Au premier toucher sur mobile : plein écran et paysage (hors application installée, déjà plein écran). */
export function autoFullscreen() {
  if (isTouch() && !isStandalone()) void enterFullscreen();
  else if (isStandalone()) lockLandscape();
}

export const isPortrait = () => isTouch() && matchMedia('(orientation: portrait)').matches;

export function setupPwa() {
  if ('serviceWorker' in navigator && import.meta.env.PROD)
    window.addEventListener('load', () => void navigator.serviceWorker.register('./sw.js').catch(() => {}));
  // hauteur réelle de l'écran (barres du navigateur mobile comprises)
  const vh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`);
  vh();
  window.addEventListener('resize', vh);
}
