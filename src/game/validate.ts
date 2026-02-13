import type { Puzzle, ValidateResult } from "./types";
import { matrixDefinition } from "./puzzles/matrix";
import { patternDefinition } from "./puzzles/pattern";
import { sequenceDefinition } from "./puzzles/sequence";
import { deductionDefinition } from "./puzzles/deduction";
import { binaryDefinition } from "./puzzles/binary";

export function validateAnswer(params: { puzzle: Puzzle; solution: unknown; answer: unknown }): ValidateResult {
  switch (params.puzzle.type) {
    case "matrix":
      return matrixDefinition.validate({ data: params.puzzle.data, solution: params.solution, answer: params.answer });
    case "pattern":
      return patternDefinition.validate({
        data: params.puzzle.data,
        solution: params.solution,
        answer: params.answer,
      });
    case "sequence":
      return sequenceDefinition.validate({
        data: params.puzzle.data,
        solution: params.solution,
        answer: params.answer,
      });
    case "deduction":
      return deductionDefinition.validate({
        data: params.puzzle.data,
        solution: params.solution,
        answer: params.answer,
      });
    case "binary":
      return binaryDefinition.validate({ data: params.puzzle.data, solution: params.solution, answer: params.answer });
  }
}

export function getHint(params: { puzzle: Puzzle; solution: unknown; hintsUsed: number }): string {
  switch (params.puzzle.type) {
    case "matrix":
      return matrixDefinition.getHint
        ? matrixDefinition.getHint({ data: params.puzzle.data, solution: params.solution, hintsUsed: params.hintsUsed })
        : "No hints available for this puzzle.";
    case "pattern":
      return patternDefinition.getHint
        ? patternDefinition.getHint({ data: params.puzzle.data, solution: params.solution, hintsUsed: params.hintsUsed })
        : "No hints available for this puzzle.";
    case "sequence":
      return sequenceDefinition.getHint
        ? sequenceDefinition.getHint({ data: params.puzzle.data, solution: params.solution, hintsUsed: params.hintsUsed })
        : "No hints available for this puzzle.";
    case "deduction":
      return deductionDefinition.getHint
        ? deductionDefinition.getHint({ data: params.puzzle.data, solution: params.solution, hintsUsed: params.hintsUsed })
        : "No hints available for this puzzle.";
    case "binary":
      return binaryDefinition.getHint
        ? binaryDefinition.getHint({ data: params.puzzle.data, solution: params.solution, hintsUsed: params.hintsUsed })
        : "No hints available for this puzzle.";
  }
}
