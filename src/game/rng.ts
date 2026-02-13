// Tiny deterministic RNG (xorshift32). Fast, reproducible, good enough for puzzle variety.

export function xorshift32(seed: number) {
  let x = seed | 0;
  if (x === 0) x = 0x6d2b79f5;

  return {
    nextInt() {
      // xorshift32
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return x | 0;
    },
    nextFloat() {
      // [0,1)
      const n = this.nextInt() >>> 0;
      return n / 0x100000000;
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.nextFloat() * arr.length)]!;
    },
    range(minInclusive: number, maxInclusive: number) {
      const span = maxInclusive - minInclusive + 1;
      return minInclusive + (Math.floor(this.nextFloat() * span) % span);
    },
  };
}

export function hashToSeed(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h | 0;
}
