/* Préférences de l'appareil (son, voix, effets). */

export interface Prefs {
  volume: number;
  voice: boolean;
  shake: boolean;
  cinematic: boolean;
}

const KEY = 'smash-friends:prefs:v1';

function load(): Prefs {
  const base: Prefs = { volume: 0.7, voice: true, shake: true, cinematic: true };
  try {
    return { ...base, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>) };
  } catch {
    return base;
  }
}

export const prefs: Prefs = load();

export function savePrefs(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* stockage indisponible */
  }
}
