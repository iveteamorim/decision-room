import type { ScoreBreakdown, ScoreWeights, WorkItem } from "@/types/decision";

export const defaultWeights: ScoreWeights = {
  revenue: 0.4,
  risk: 0.3,
  urgency: 0.2,
  workload: 0.1,
};

function normalizeRevenue(valueEur: number) {
  return Math.min(valueEur / 25000, 1);
}

export function scoreItem(
  item: WorkItem,
  weights: ScoreWeights = defaultWeights,
): ScoreBreakdown {
  const revenue = normalizeRevenue(item.valueEur) * weights.revenue;
  const risk = (1 - item.riskScore) * weights.risk;
  const urgency = item.urgencyScore * weights.urgency;
  const workload = (1 - item.workloadScore) * weights.workload;
  const total = revenue + risk + urgency + workload;

  return {
    revenue,
    risk,
    urgency,
    workload,
    total,
  };
}
