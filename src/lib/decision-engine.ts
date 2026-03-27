import { applyPolicies } from "@/lib/policies";
import { defaultWeights, scoreItem } from "@/lib/scoring";
import type { DecisionAction, DecisionResult, ScoreWeights, WorkItem } from "@/types/decision";

function chooseAction(total: number): DecisionAction {
  if (total >= 0.72) return "prioritize";
  if (total >= 0.56) return "review";
  if (total >= 0.4) return "delay";
  return "reject";
}

function buildRationale(item: WorkItem, total: number) {
  return [
    `Value EUR: ${item.valueEur}`,
    `Risk score: ${item.riskScore.toFixed(2)}`,
    `Urgency score: ${item.urgencyScore.toFixed(2)}`,
    `Workload score: ${item.workloadScore.toFixed(2)}`,
    `Confidence: ${item.confidence.toFixed(2)}`,
    `Composite score: ${total.toFixed(2)}`,
  ];
}

export function decideItem(
  item: WorkItem,
  weights: ScoreWeights = defaultWeights,
): DecisionResult {
  const policyResult = applyPolicies(item);
  const scoreBreakdown = scoreItem(item, weights);
  const rationale = buildRationale(item, scoreBreakdown.total);

  if (policyResult) {
    return {
      itemId: item.id,
      action: policyResult.action,
      scoreBreakdown,
      rationale: [...rationale, `Policy override: ${policyResult.triggeredBy}`],
      policyResult,
      requiresHumanReview: policyResult.action === "review",
    };
  }

  const action = chooseAction(scoreBreakdown.total);
  const requiresHumanReview = item.confidence < 0.55 && action !== "reject";

  return {
    itemId: item.id,
    action: requiresHumanReview ? "review" : action,
    scoreBreakdown,
    rationale,
    requiresHumanReview,
  };
}
