import { xorshift32 } from "../rng";
import type { BinaryPuzzleData, PuzzleDefinition, ValidateResult } from "../types";

type BinarySolution = {
  out: 0 | 1;
};

type Op = "AND" | "OR" | "XOR";

function evalOp(op: Op, a: 0 | 1, b: 0 | 1): 0 | 1 {
  if (op === "AND") return (a & b) as 0 | 1;
  if (op === "OR") return (a | b) as 0 | 1;
  return (a ^ b) as 0 | 1;
}

export const binaryDefinition: PuzzleDefinition<BinaryPuzzleData> = {
  type: "binary",
  title: "Binary Logic",

  generate: ({ seed }) => {
    const rng = xorshift32(seed);
    const ops: Op[] = ["AND", "OR", "XOR"];
    const op1 = rng.pick(ops);
    const op2 = rng.pick(ops);

    const A = (rng.range(0, 1) as 0 | 1);
    const B = (rng.range(0, 1) as 0 | 1);
    const C = (rng.range(0, 1) as 0 | 1);

    const expression = `(A ${op1} B) ${op2} C`;
    const out = evalOp(op2, evalOp(op1, A, B), C);

    const prompt = `Compute the output for ${expression} with A=${A}, B=${B}, C=${C}. Answer 0 or 1.`;

    return {
      prompt,
      data: { expression, inputs: { A, B, C } },
      solution: { out } satisfies BinarySolution,
    };
  },

  validate: ({ solution, answer }): ValidateResult => {
    const ansNum = typeof answer === "number" ? answer : typeof answer === "string" ? Number(answer.trim()) : NaN;
    if (!(ansNum === 0 || ansNum === 1)) return { ok: false, message: "Enter 0 or 1." };

    const out =
      solution &&
      typeof solution === "object" &&
      "out" in solution &&
      (((solution as { out?: unknown }).out as unknown) === 0 || ((solution as { out?: unknown }).out as unknown) === 1)
        ? ((solution as { out: 0 | 1 }).out as 0 | 1)
        : null;
    if (out == null) return { ok: false, message: "Invalid solution" };
    return ansNum === out ? { ok: true, message: "Correct!" } : { ok: false, message: "Not quite." };
  },

  getHint: ({ data }) => {
    return `Evaluate inside parentheses first. Inputs: A=${data.inputs.A}, B=${data.inputs.B}, C=${data.inputs.C}.`;
  },
};
