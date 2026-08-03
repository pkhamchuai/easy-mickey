import type { SongComparison } from "./types";

export type SongMatchAnswerPattern = {
  aSelections: number;
  bSelections: number;
  tieSelections: number;
  neitherSelections: number;
  sideBiasRatio: number;
  longestSameSideStreak: number;
  lowConfidence: boolean;
  reasons: string[];
};

export function analyzeAnswerPattern(comparisons: SongComparison[]): SongMatchAnswerPattern {
  let aSelections = 0;
  let bSelections = 0;
  let tieSelections = 0;
  let neitherSelections = 0;
  let currentSide: "A" | "B" | null = null;
  let currentStreak = 0;
  let longestSameSideStreak = 0;

  for (const comparison of comparisons) {
    const outcome = comparison.outcome ?? "pick";
    if (outcome !== "pick" || !comparison.winner) {
      if (outcome === "tie") tieSelections += 1;
      if (outcome === "neither") neitherSelections += 1;
      currentSide = null;
      currentStreak = 0;
      continue;
    }
    const side = comparison.winner === comparison.songA ? "A" : "B";
    if (side === "A") aSelections += 1;
    else bSelections += 1;
    currentStreak = currentSide === side ? currentStreak + 1 : 1;
    currentSide = side;
    longestSameSideStreak = Math.max(longestSameSideStreak, currentStreak);
  }

  const decisiveTotal = aSelections + bSelections;
  const sideBiasRatio = decisiveTotal > 0 ? Math.max(aSelections, bSelections) / decisiveTotal : 0.5;
  const reasons: string[] = [];
  if (decisiveTotal >= 10 && sideBiasRatio >= 0.85) reasons.push("strong-side-bias");
  if (decisiveTotal >= 10 && longestSameSideStreak >= 15) reasons.push("long-side-streak");

  return {
    aSelections,
    bSelections,
    tieSelections,
    neitherSelections,
    sideBiasRatio,
    longestSameSideStreak,
    lowConfidence: reasons.length > 0,
    reasons,
  };
}
