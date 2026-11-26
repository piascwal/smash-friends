/* Navigation au clavier et à la manette dans les menus : déplace le focus vers l'élément le plus
   proche dans la direction demandée parmi ceux marqués [data-nav]. */
import type { NavAction } from '../input/device';

export function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-nav]')].filter(
    (e) => e.offsetParent !== null && !e.hasAttribute('disabled'),
  );
}

export function focusFirst(root: HTMLElement): void {
  const first = root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(root)[0];
  first?.focus({ preventScroll: true });
}

/** Focus suivant dans une direction (recherche spatiale). */
export function moveFocus(root: HTMLElement, a: NavAction): void {
  const items = focusables(root);
  const cur = document.activeElement as HTMLElement | null;
  if (!cur || !items.includes(cur)) return focusFirst(root);
  const r0 = cur.getBoundingClientRect();
  const c0 = { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2 };
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of items) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect();
    const dx = r.left + r.width / 2 - c0.x;
    const dy = r.top + r.height / 2 - c0.y;
    const ok = a === 'up' ? dy < -4 : a === 'down' ? dy > 4 : a === 'left' ? dx < -4 : dx > 4;
    if (!ok) continue;
    const main = a === 'up' || a === 'down' ? Math.abs(dy) : Math.abs(dx);
    const cross = a === 'up' || a === 'down' ? Math.abs(dx) : Math.abs(dy);
    const score = main + cross * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  best?.focus({ preventScroll: false });
}
