import { xorshift32 } from "../rng";
import type { MatrixPuzzleData, PuzzleDefinition, ValidateResult } from "../types";

type MatrixSolution = {
  solved: number[][];
};

function makeSolved4x4(rng: ReturnType<typeof xorshift32>): number[][] {
  // Base 4x4 Latin square then shuffle rows/cols within bands.
  const base = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];

  const swapRows = (a: number, b: number) => {
    const tmp = base[a]!;
    base[a] = base[b]!;
    base[b] = tmp;
  };
  const swapCols = (a: number, b: number) => {
    for (const row of base) {
      const tmp = row[a]!;
      row[a] = row[b]!;
      row[b] = tmp;
    }
  };

  // shuffle within 0-1 and 2-3
  if (rng.nextFloat() < 0.5) swapRows(0, 1);
  if (rng.nextFloat() < 0.5) swapRows(2, 3);
  if (rng.nextFloat() < 0.5) swapCols(0, 1);
  if (rng.nextFloat() < 0.5) swapCols(2, 3);

  return base.map((r) => [...r]);
}

function maskCells(solved: number[][], rng: ReturnType<typeof xorshift32>, blanks: number): number[][] {
  const grid = solved.map((r) => [...r]);
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) positions.push([r, c]);

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng.nextFloat() * (i + 1));
    const tmp = positions[i]!;
    positions[i] = positions[j]!;
    positions[j] = tmp;
  }

  for (let i = 0; i < blanks && i < positions.length; i++) {
    const [r, c] = positions[i]!;
    grid[r]![c] = 0;
  }

  return grid;
}

function parseMatrixAnswer(answer: unknown): number[][] | null {
  if (Array.isArray(answer)) return answer as number[][];
  if (typeof answer !== "string") return null;

  // Accept 16 digits with optional spaces/commas/newlines.
  const digits = answer.replace(/[^0-9]/g, "");
  if (digits.length !== 16) return null;

  const out: number[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: number[] = [];
    for (let c = 0; c < 4; c++) {
      row.push(Number(digits[r * 4 + c]));
    }
    out.push(row);
  }
  return out;
}

function isValidSolved(grid: number[][]): boolean {
  if (grid.length !== 4) return false;
  for (const row of grid) if (!row || row.length !== 4) return false;

  const setOk = (arr: number[]) => {
    const s = new Set(arr);
    if (s.size !== 4) return false;
    for (const v of s) if (v < 1 || v > 4) return false;
    return true;
  };

  for (let r = 0; r < 4; r++) if (!setOk(grid[r]!)) return false;
  for (let c = 0; c < 4; c++) if (!setOk([grid[0]![c]!, grid[1]![c]!, grid[2]![c]!, grid[3]![c]!])) return false;

  // 2x2 blocks
  const blocks = [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ] as const;
  for (const [br, bc] of blocks) {
    const vals = [
      grid[br]![bc]!,
      grid[br]![bc + 1]!,
      grid[br + 1]![bc]!,
      grid[br + 1]![bc + 1]!,
    ];
    if (!setOk(vals)) return false;
  }

  return true;
}

export const matrixDefinition: PuzzleDefinition<MatrixPuzzleData> = {
  type: "matrix",
  title: "Number Matrix",

  generate: ({ seed }) => {
    const rng = xorshift32(seed);
    const solved = makeSolved4x4(rng);
    const blanks = rng.range(6, 9);
    const grid = maskCells(solved, rng, blanks);

    return {
      prompt: "Fill the 4×4 grid with numbers 1–4. Each row/column and each 2×2 block must contain 1–4 exactly once.",
      data: { grid },
      solution: { solved } satisfies MatrixSolution,
    };
  },

  validate: ({ data, solution, answer }): ValidateResult => {
    const parsed = parseMatrixAnswer(answer);
    if (!parsed) return { ok: false, message: "Enter 16 digits (1–4) for the full 4×4 solution." };

    // Ensure given clues are respected
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const clue = data.grid[r]![c]!;
        if (clue !== 0 && parsed[r]![c] !== clue) {
          return { ok: false, message: "Your solution changes a given clue." };
        }
      }
    }

    if (!isValidSolved(parsed)) return { ok: false, message: "Rules not satisfied yet." };

    const solved =
      solution && typeof solution === "object" && "solved" in solution && Array.isArray((solution as { solved?: unknown }).solved)
        ? ((solution as { solved: number[][] }).solved as number[][])
        : null;
    if (!solved) return { ok: false, message: "Invalid solution" };
    const matches = solved.every((row, r) => row.every((v, c) => parsed[r]![c] === v));
    return matches ? { ok: true, message: "Correct!" } : { ok: false, message: "Not quite. Keep trying." };
  },

  getHint: ({ data, solution, hintsUsed }) => {
    const solved =
      solution && typeof solution === "object" && "solved" in solution && Array.isArray((solution as { solved?: unknown }).solved)
        ? ((solution as { solved: number[][] }).solved as number[][])
        : null;
    if (!solved) return "No hint available.";
    // Reveal one empty cell value at a time
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (data.grid[r]![c] === 0) {
          // Stagger by hintsUsed to avoid always revealing same cell
          const idx = (r * 4 + c + hintsUsed) % 16;
          const rr = Math.floor(idx / 4);
          const cc = idx % 4;
          if (data.grid[rr]![cc] === 0) {
            return `Cell (${rr + 1},${cc + 1}) is ${solved[rr]![cc]}.`;
          }
          return `Cell (${r + 1},${c + 1}) is ${solved[r]![c]}.`;
        }
      }
    }
    return "No empty cells to hint.";
  },
};
