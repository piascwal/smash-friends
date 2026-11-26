/* Hasard reproductible (mulberry32) : une même graine rejoue la même partie, ce qui sert aux tests. */

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  /** Nombre dans [0, 1[. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, maxIncluded: number): number {
    return Math.floor(this.range(min, maxIncluded + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)]!;
  }

  /** Tirage pondéré : chaque élément a son poids. */
  weighted<T>(list: readonly { item: T; weight: number }[]): T {
    const total = list.reduce((s, e) => s + e.weight, 0);
    let r = this.next() * total;
    for (const e of list) {
      r -= e.weight;
      if (r <= 0) return e.item;
    }
    return list[list.length - 1]!.item;
  }
}
