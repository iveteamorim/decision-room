import { buildExplanation, buildRationale } from "./explainability";
import { buildDecisionLedger } from "./events";
import { evaluatePolicies } from "./policies";
import { defaultWeights, scoreDeal } from "./scoring";
import { buildWorkflowPlan } from "./workflow";
import type { DecisionAction, DecisionResult, ScoreWeights, WorkItem } from "./types";

function chooseAction(total: number): DecisionAction {
  if (total >= 0.72) return "approve";
  if (total >= 0.56) return "negotiate";
  if (total >= 0.4) return "review";
  return "reject";
}

function enforceHumanControl(
  item: WorkItem,
  action: DecisionAction,
  decisivePolicyAction?: DecisionAction,
): DecisionAction {
  if (decisivePolicyAction) return decisivePolicyAction;
  if (
    item.approvalState === "ready_to_send" &&
    item.blockers.length === 0 &&
    !item.policyBlock &&
    item.riskScore <= 0.35 &&
    item.confidence >= 0.78
  ) {
    return "approve";
  }
  if (item.confidence < 0.55 && action !== "reject") return "review";
  if (item.blockers.length > 0 && action === "approve") return "review";
  return action;
}

export function decideItem(
  item: WorkItem,
  weights: ScoreWeights = defaultWeights,
): DecisionResult {
  const policyEvaluation = evaluatePolicies(item);
  const scoring = scoreDeal(item, weights);
  const scoreAction = chooseAction(scoring.breakdown.total);
  const action = enforceHumanControl(
    item,
    scoreAction,
    policyEvaluation.decisivePolicy?.action,
  );
  const workflow = buildWorkflowPlan(item, action, policyEvaluation);
  const ledger = buildDecisionLedger({
    item,
    action,
    scoring,
    policyEvaluation,
    workflow,
  });
  const requiresHumanReview =
    action === "review" ||
    workflow.checkpoints.some((checkpoint) => checkpoint.status === "blocked");

  return {
    itemId: item.id,
    action,
    scoreBreakdown: scoring.breakdown,
    scoreEvidence: scoring.evidence,
    rationale: buildRationale(item, action, scoring, policyEvaluation, workflow),
    explanation: buildExplanation(item, action, scoring, policyEvaluation, workflow),
    policyResult: policyEvaluation.decisivePolicy,
    policyTrace: policyEvaluation.trace,
    workflow,
    aiAssistedSignal: scoring.aiAssistedSignal,
    ledger,
    requiresHumanReview,
  };
}
