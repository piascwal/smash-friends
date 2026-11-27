/* Couleurs des joueurs (et des équipes). */

export const SLOT_COLORS = ['#ef3b2c', '#3b7bff', '#ffc21a', '#2fbf4a'] as const;
export const TEAM_COLORS = ['#ef3b2c', '#3b7bff', '#2fbf4a', '#ffc21a'] as const;
export const CPU_COLOR = '#9aa0ab';

export const TEAM_NAMES = ['Rouge', 'Bleue', 'Verte', 'Jaune'] as const;

/** Couleur des pourcents : blanc, puis jaune, orange, rouge et rouge sombre avec les dégâts. */
export function percentColor(p: number): string {
  const stops: [number, [number, number, number]][] = [
    [0, [255, 255, 255]],
    [40, [255, 236, 120]],
    [80, [255, 160, 50]],
    [120, [240, 60, 40]],
    [180, [150, 20, 20]],
  ];
  let i = 0;
  while (i < stops.length - 2 && p > stops[i + 1]![0]) i++;
  const [p0, c0] = stops[i]!;
  const [p1, c1] = stops[i + 1]!;
  const t = Math.max(0, Math.min(1, (p - p0) / (p1 - p0)));
  const c = c0.map((v, k) => Math.round(v + (c1[k]! - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
