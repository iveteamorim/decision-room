import type { ScoreBreakdown, ScoreWeights, WorkItem } from "@/types/decision";

export const defaultWeights: ScoreWeights = {
  value: 0.35,
  risk: 0.25,
  urgency: 0.15,
  margin: 0.25,
};

function normalizeValue(valueEur: number) {
  return Math.min(valueEur / 25000, 1);
}

export function scoreItem(
  item: WorkItem,
  weights: ScoreWeights = defaultWeights,
): ScoreBreakdown {
  const value = normalizeValue(item.valueEur) * weights.value;
  const risk = (1 - item.riskScore) * weights.risk;
  const urgency = item.urgencyScore * weights.urgency;
  const margin = item.marginScore * weights.margin;
  const total = value + risk + urgency + margin;

  return {
    value,
    risk,
    urgency,
    margin,
    total,
  };
}
