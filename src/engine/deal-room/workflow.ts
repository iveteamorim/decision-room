import type {
  CheckpointStatus,
  DecisionAction,
  PolicyEvaluation,
  Team,
  WorkflowCheckpoint,
  WorkflowPlan,
  WorkItem,
} from "./types";

function statusFor(required: boolean, blocked: boolean): CheckpointStatus {
  if (!required) return "not_required";
  return blocked ? "blocked" : "open";
}

function ownerForAction(item: WorkItem, action: DecisionAction, policyEvaluation: PolicyEvaluation): Team {
  if (policyEvaluation.decisivePolicy) return policyEvaluation.decisivePolicy.owner;
  if (action === "negotiate" || action === "reject") return "Finance";
  if (action === "review") return item.owner;
  return "Sales";
}

export function buildWorkflowPlan(
  item: WorkItem,
  action: DecisionAction,
  policyEvaluation: PolicyEvaluation,
): WorkflowPlan {
  const hasFinanceBlocker = item.marginScore < 0.45 || item.blockers.some((blocker) => blocker.toLowerCase().includes("margin"));
  const hasLegalBlocker = item.riskScore >= 0.82 || item.approvalState === "legal_review";
  const hasHumanReview = item.confidence < 0.55 || action === "review";
  const hasStakeholderConflict = new Set(item.stakeholders.map((stakeholder) => stakeholder.position)).size > 1;

  const checkpoints: WorkflowCheckpoint[] = [
    {
      id: "finance-approval",
      label: "Finance approval",
      owner: "Finance",
      required: hasFinanceBlocker || item.valueEur >= 25000,
      status: statusFor(hasFinanceBlocker || item.valueEur >= 25000, hasFinanceBlocker),
      reason: hasFinanceBlocker
        ? "Margin or discount terms require finance clearance."
        : "High-value deal requires finance sign-off before execution.",
    },
    {
      id: "legal-review",
      label: "Legal review",
      owner: "Legal",
      required: hasLegalBlocker,
      status: statusFor(hasLegalBlocker, hasLegalBlocker),
      reason: "Risk score or contract terms require legal validation.",
    },
    {
      id: "human-review",
      label: "Human checkpoint",
      owner: item.owner,
      required: hasHumanReview,
      status: statusFor(hasHumanReview, item.blockers.length > 0),
      reason: "Low confidence, active blockers, or review action requires operator control.",
    },
    {
      id: "cross-functional-review",
      label: "Cross-functional alignment",
      owner: "Policy",
      required: hasStakeholderConflict,
      status: statusFor(hasStakeholderConflict, hasStakeholderConflict),
      reason: "Sales, finance, legal, ops, or policy positions diverge.",
    },
  ];

  const owner = ownerForAction(item, action, policyEvaluation);
  const nextActions = [
    action === "approve" ? "Approve deal and create an auditable approval record." : undefined,
    action === "negotiate" ? "Return terms to sales with required margin or commitment changes." : undefined,
    action === "review" ? `Escalate to ${owner} with policy trace and evidence.` : undefined,
    action === "reject" ? "Reject current terms and record rejection reason." : undefined,
    item.blockers.length > 0 ? `Clear ${item.blockers.length} open blocker${item.blockers.length === 1 ? "" : "s"}.` : undefined,
  ].filter((entry): entry is string => Boolean(entry));

  const sideEffects = [
    "Write decision trace to approval history.",
    policyEvaluation.decisivePolicy ? `Attach policy violation ${policyEvaluation.decisivePolicy.id}.` : undefined,
    checkpoints.some((checkpoint) => checkpoint.status === "blocked") ? "Prevent customer-facing quote until blockers clear." : undefined,
    action === "approve" ? "Unlock send-to-customer workflow." : undefined,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    state: item.approvalState,
    owner,
    checkpoints,
    nextActions,
    sideEffects,
  };
}
