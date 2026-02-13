import { xorshift32 } from "../rng";
import type { DeductionPuzzleData, PuzzleDefinition, ValidateResult } from "../types";

type DeductionSolution = {
  correctIndex: number;
};

const NAMES = ["Ava", "Noah", "Mia", "Liam", "Zoe", "Ethan"];
const COLORS = ["Blue", "Purple", "Orange", "White"];

export const deductionDefinition: PuzzleDefinition<DeductionPuzzleData> = {
  type: "deduction",
  title: "Deduction Grid",

  generate: ({ seed }) => {
    const rng = xorshift32(seed);
    const name1 = rng.pick(NAMES);
    const name2 = rng.pick(NAMES.filter((n) => n !== name1));
    const color1 = rng.pick(COLORS);
    const color2 = rng.pick(COLORS.filter((c) => c !== color1));

    const question = `Two players ${name1} and ${name2} picked different colors: ${color1} and ${color2}. ` +
      `Clue: ${name1} did not pick ${color1}. Who picked ${color1}?`;

    const options = [name1, name2];
    const fixedCorrectIndex = 1;

    return {
      prompt: question,
      data: { question, options },
      solution: { correctIndex: fixedCorrectIndex } satisfies DeductionSolution,
    };
  },

  validate: ({ data, solution, answer }): ValidateResult => {
    const ans = typeof answer === "string" ? answer.trim() : "";
    if (!ans) return { ok: false, message: "Pick one option." };
    const idx = data.options.indexOf(ans);
    if (idx === -1) return { ok: false, message: "Answer must be one of the options." };

    const correctIndex =
      solution &&
      typeof solution === "object" &&
      "correctIndex" in solution &&
      typeof (solution as { correctIndex?: unknown }).correctIndex === "number"
        ? (solution as { correctIndex: number }).correctIndex
        : null;
    if (correctIndex == null) return { ok: false, message: "Invalid solution" };
    return idx === correctIndex ? { ok: true, message: "Correct!" } : { ok: false, message: "Not quite." };
  },

  getHint: ({ data }) => {
    return `Use the clue to eliminate one option. Choices: ${data.options.join(" / ")}.`;
  },
};
