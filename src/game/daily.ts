import { hashToSeed, xorshift32 } from "./rng";
import type { Puzzle, PuzzleType } from "./types";
import { matrixDefinition } from "./puzzles/matrix";
import { patternDefinition } from "./puzzles/pattern";
import { sequenceDefinition } from "./puzzles/sequence";
import { deductionDefinition } from "./puzzles/deduction";
import { binaryDefinition } from "./puzzles/binary";

const ROTATION: PuzzleType[] = ["matrix", "pattern", "sequence", "deduction", "binary"];

export function pickDailyPuzzleType(dateKey: string): PuzzleType {
  const seed = hashToSeed(dateKey);
  const idx = (seed >>> 0) % ROTATION.length;
  return ROTATION[idx]!;
}

export function generateDailyPuzzle(dateKey: string): { puzzle: Puzzle; solution: unknown } {
  const type = pickDailyPuzzleType(dateKey);
  const seed = hashToSeed(`${dateKey}:${type}`);

  switch (type) {
    case "matrix": {
      const gen = matrixDefinition.generate({ dateKey, seed });
      return {
        puzzle: {
          id: `${dateKey}:${type}`,
          dateKey,
          type,
          title: matrixDefinition.title,
          prompt: gen.prompt,
          data: gen.data,
        },
        solution: gen.solution,
      };
    }
    case "pattern": {
      const gen = patternDefinition.generate({ dateKey, seed });
      return {
        puzzle: {
          id: `${dateKey}:${type}`,
          dateKey,
          type,
          title: patternDefinition.title,
          prompt: gen.prompt,
          data: gen.data,
        },
        solution: gen.solution,
      };
    }
    case "sequence": {
      const gen = sequenceDefinition.generate({ dateKey, seed });
      return {
        puzzle: {
          id: `${dateKey}:${type}`,
          dateKey,
          type,
          title: sequenceDefinition.title,
          prompt: gen.prompt,
          data: gen.data,
        },
        solution: gen.solution,
      };
    }
    case "deduction": {
      const gen = deductionDefinition.generate({ dateKey, seed });
      return {
        puzzle: {
          id: `${dateKey}:${type}`,
          dateKey,
          type,
          title: deductionDefinition.title,
          prompt: gen.prompt,
          data: gen.data,
        },
        solution: gen.solution,
      };
    }
    case "binary": {
      const gen = binaryDefinition.generate({ dateKey, seed });
      return {
        puzzle: {
          id: `${dateKey}:${type}`,
          dateKey,
          type,
          title: binaryDefinition.title,
          prompt: gen.prompt,
          data: gen.data,
        },
        solution: gen.solution,
      };
    }
  }
}

export function precomputeNextDays(dateKey: string, daysAhead: number): string[] {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  const base = new Date(y!, (m ?? 1) - 1, d ?? 1);

  const keys: string[] = [];
  for (let i = 0; i <= daysAhead; i++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    keys.push(`${yy}-${mm}-${dd}`);
  }
  return keys;
}

export function dailyRng(dateKey: string) {
  return xorshift32(hashToSeed(dateKey));
}
