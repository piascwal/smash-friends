/* Petits outils pour construire les écrans en DOM. */

type Attrs = Record<string, string | number | boolean | undefined | ((e: Event) => void)>;

/** Crée un élément : h('button.big', { onclick }, 'texte', enfant…). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: `${K}${string}`,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const [name, ...classes] = tag.split('.') as [K, ...string[]];
  const el = document.createElement(name);
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v);
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.firstChild.remove();
}
