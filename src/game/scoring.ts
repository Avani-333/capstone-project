export function computeScore(params: {
  solved: boolean;
  hintsUsed: number;
  attempts: number;
  timeTakenMs: number;
}): number {
  if (!params.solved) return 0;

  const base = 1000;
  const hintPenalty = params.hintsUsed * 150;
  const attemptPenalty = Math.max(0, params.attempts - 1) * 50;

  // 2 points per second (caps naturally via max(0, ...))
  const timePenalty = Math.floor(Math.max(0, params.timeTakenMs) / 1000) * 2;

  return Math.max(0, Math.round(base - hintPenalty - attemptPenalty - timePenalty));
}
