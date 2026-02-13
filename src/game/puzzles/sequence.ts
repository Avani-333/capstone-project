import { xorshift32 } from "../rng";
import type { PuzzleDefinition, SequencePuzzleData, ValidateResult } from "../types";

type SequenceSolution = {
  next: number;
};

export const sequenceDefinition: PuzzleDefinition<SequencePuzzleData> = {
  type: "sequence",
  title: "Sequence Solver",

  generate: ({ seed }) => {
    const rng = xorshift32(seed);

    // Pick a simple rule family
    const kind = rng.range(0, 2);

    let terms: number[];
    let next: number;
    let prompt: string;

    if (kind === 0) {
      // arithmetic
      const start = rng.range(1, 20);
      const step = rng.range(2, 9);
      terms = [start, start + step, start + 2 * step, start + 3 * step];
      next = start + 4 * step;
      prompt = `What is the next number? ${terms.join(", ")}, ?`;
    } else if (kind === 1) {
      // multiply then add
      const start = rng.range(1, 10);
      const mul = rng.range(2, 4);
      const add = rng.range(1, 6);
      terms = [start];
      for (let i = 0; i < 3; i++) terms.push(terms[terms.length - 1]! * mul + add);
      next = terms[terms.length - 1]! * mul + add;
      prompt = `Find the next term: ${terms.join(", ")}, ?`;
    } else {
      // Fibonacci-ish: a,b,a+b,b+(a+b)
      const a = rng.range(1, 9);
      const b = rng.range(1, 9);
      const c = a + b;
      const d = b + c;
      terms = [a, b, c, d];
      next = c + d;
      prompt = `What comes next? ${terms.join(", ")}, ?`;
    }

    return {
      prompt,
      data: { terms },
      solution: { next } satisfies SequenceSolution,
    };
  },

  validate: ({ solution, answer }): ValidateResult => {
    const ansNum = typeof answer === "number" ? answer : typeof answer === "string" ? Number(answer.trim()) : NaN;
    if (!Number.isFinite(ansNum)) return { ok: false, message: "Enter a number." };

    const next =
      solution && typeof solution === "object" && "next" in solution && typeof (solution as { next?: unknown }).next === "number"
        ? (solution as { next: number }).next
        : null;
    if (next == null) return { ok: false, message: "Invalid solution" };
    return ansNum === next ? { ok: true, message: "Correct!" } : { ok: false, message: "Not quite." };
  },

  getHint: ({ data }) => {
    return `Look at the differences or how each term is built from the previous ones: ${data.terms.join(", ")}.`;
  },
};
