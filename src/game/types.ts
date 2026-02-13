export type PuzzleType = "matrix" | "pattern" | "sequence" | "deduction" | "binary";

export type PuzzleBase = {
  id: string;
  type: PuzzleType;
  dateKey: string; // YYYY-MM-DD (local)
  title: string;
  prompt: string;
};

export type Puzzle =
  | (PuzzleBase & { type: "matrix"; data: MatrixPuzzleData })
  | (PuzzleBase & { type: "pattern"; data: PatternPuzzleData })
  | (PuzzleBase & { type: "sequence"; data: SequencePuzzleData })
  | (PuzzleBase & { type: "deduction"; data: DeductionPuzzleData })
  | (PuzzleBase & { type: "binary"; data: BinaryPuzzleData });

export type ValidateResult = {
  ok: boolean;
  message: string;
};

export type PuzzleDefinition<TData> = {
  type: PuzzleType;
  title: string;
  generate: (params: { dateKey: string; seed: number }) => { prompt: string; data: TData; solution: unknown };
  validate: (params: { data: TData; solution: unknown; answer: unknown }) => ValidateResult;
  getHint?: (params: { data: TData; solution: unknown; hintsUsed: number }) => string;
};

export type MatrixPuzzleData = {
  // 4x4 mini-sudoku style: 0 means empty
  grid: number[][];
};

export type PatternPuzzleData = {
  // choose next symbol from options
  sequence: string[];
  options: string[];
};

export type SequencePuzzleData = {
  terms: number[];
};

export type DeductionPuzzleData = {
  // small logic question with choices
  question: string;
  options: string[];
};

export type BinaryPuzzleData = {
  // evaluate a boolean expression for given inputs
  expression: string; // e.g. (A AND B) XOR C
  inputs: { A: 0 | 1; B: 0 | 1; C: 0 | 1 };
};
