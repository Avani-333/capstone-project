import { xorshift32 } from "../rng";
import type { PatternPuzzleData, PuzzleDefinition, ValidateResult } from "../types";

type PatternSolution = {
  next: string;
};

const SYMBOLS = ["▲", "●", "■", "◆", "★", "✚"];

export const patternDefinition: PuzzleDefinition<PatternPuzzleData> = {
  type: "pattern",
  title: "Pattern Match",

  generate: ({ seed }) => {
    const rng = xorshift32(seed);
    const a = rng.pick(SYMBOLS);
    const b = rng.pick(SYMBOLS.filter((s) => s !== a));
    const c = rng.pick(SYMBOLS.filter((s) => s !== a && s !== b));

    // Simple repeating pattern of length 3: A B C A B C _
    const sequence = [a, b, c, a, b, c];
    const next = a;

    const options = Array.from(new Set([a, b, c, rng.pick(SYMBOLS)])).slice(0, 4);
    while (options.length < 4) options.push(rng.pick(SYMBOLS));

    // shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rng.nextFloat() * (i + 1));
      const tmp = options[i]!;
      options[i] = options[j]!;
      options[j] = tmp;
    }

    return {
      prompt: `Choose the next symbol in the sequence: ${sequence.join(" ")} ?`,
      data: { sequence, options },
      solution: { next } satisfies PatternSolution,
    };
  },

  validate: ({ data, solution, answer }): ValidateResult => {
    const ans = typeof answer === "string" ? answer.trim() : "";
    if (!ans) return { ok: false, message: "Pick one option." };
    if (!data.options.includes(ans)) return { ok: false, message: "Answer must be one of the options." };

    const next =
      solution && typeof solution === "object" && "next" in solution && typeof (solution as { next?: unknown }).next === "string"
        ? (solution as { next: string }).next
        : null;
    if (!next) return { ok: false, message: "Invalid solution" };
    return ans === next ? { ok: true, message: "Correct!" } : { ok: false, message: "Not quite." };
  },

  getHint: ({ solution }) => {
    const next =
      solution && typeof solution === "object" && "next" in solution && typeof (solution as { next?: unknown }).next === "string"
        ? (solution as { next: string }).next
        : null;
    if (!next) return "No hint available.";
    return `This sequence repeats every 3 symbols. The next one is ${next}.`;
  },
};
