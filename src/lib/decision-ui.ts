import type { ApprovalState, DecisionResult, WorkItem } from "@/engine/deal-room";

const EUR_LOCALE = "de-DE";

export function formatEur(amount: number) {
  return amount.toLocaleString(EUR_LOCALE);
}

export const dealContext: Record<string, string> = {
  "deal-1": "Enterprise discount is within margin guardrails, but the approval window is short.",
  "deal-2": "High-value contract request pushes margin below the approval threshold.",
  "deal-3": "Custom liability terms add legal risk before signature.",
  "deal-4": "Renewal uplift is clean, profitable, and low-risk.",
  "deal-5": "Expansion forecast has weak confidence and needs human review.",
  "deal-7": "Pilot economics do not justify approval under current terms.",
};

export const recommendedPaths: Record<string, string> = {
  "deal-1": "Approve if the discount stays at 18% and standard payment terms remain unchanged.",
  "deal-2": "Negotiate discount down or add term length before approval.",
  "deal-3": "Route to legal and approve only after liability exposure is capped.",
  "deal-4": "Approve renewal uplift with standard terms.",
  "deal-5": "Request review from sales leadership before committing expansion forecast.",
  "deal-7": "Reject current pilot terms or require a paid setup fee.",
};

export function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function stateLabel(state: ApprovalState) {
  if (state === "awaiting_approval") return "Awaiting approval";
  if (state === "policy_conflict") return "Policy conflict";
  if (state === "legal_review") return "Legal review";
  if (state === "ready_to_send") return "Ready to send";
  return "Terms rejected";
}

export function commandFor(action: DecisionResult["action"]) {
  if (action === "approve") return "Approve";
  if (action === "negotiate") return "Negotiate";
  if (action === "review") return "Review";
  return "Reject";
}

export function reasonFor(result: DecisionResult) {
  if (result.policyResult) return result.policyResult.reason;
  if (result.requiresHumanReview) return "Confidence is low, so the operator stays in control.";
  if (result.action === "approve") return "Margin, risk, urgency, and confidence support approval.";
  if (result.action === "negotiate") return "The deal has value, but terms need margin protection.";
  if (result.action === "review") return "The approval requires human judgment before commitment.";
  return "The value-to-margin trade-off is not strong enough to approve.";
}

export function headlineFor(result: DecisionResult) {
  if (result.action === "approve") return "Approved by the engine, pending final sign-off.";
  if (result.action === "negotiate") return "Commercial upside is real, but the terms need protection.";
  if (result.action === "review") return "The decision is commercially relevant, but human judgment stays in control.";
  return "The current deal shape is too weak to justify approval.";
}

export function hasStakeholderConflict(item: WorkItem) {
  return new Set(item.stakeholders.map((stakeholder) => stakeholder.position)).size > 1;
}

export function stakeholderSummary(item: WorkItem) {
  const positions = Array.from(new Set(item.stakeholders.map((stakeholder) => stakeholder.position)));
  if (positions.length === 1) return "Teams are aligned on the recommended path.";
  return item.stakeholders.map((stakeholder) => `${stakeholder.team}: ${stakeholder.position}`).join(" | ");
}

export type PolicyCheckStatus = "pass" | "warning" | "blocked";

export function buildPolicyChecks(item: WorkItem, result: DecisionResult) {
  return [
    {
      label: "Margin guardrail",
      status: (item.marginScore >= 0.7 ? "pass" : item.marginScore >= 0.5 ? "warning" : "blocked") as PolicyCheckStatus,
      detail: `${pct(item.marginScore)} margin against protected threshold.`,
    },
    {
      label: "Risk exposure",
      status: (item.riskScore <= 0.35 ? "pass" : item.riskScore <= 0.65 ? "warning" : "blocked") as PolicyCheckStatus,
      detail: `${pct(item.riskScore)} delivery and commercial risk.`,
    },
    {
      label: "Confidence",
      status: (item.confidence >= 0.78 ? "pass" : item.confidence >= 0.58 ? "warning" : "blocked") as PolicyCheckStatus,
      detail: `${pct(item.confidence)} confidence in the recommendation path.`,
    },
    {
      label: "Approval path",
      status: (result.requiresHumanReview || item.blockers.length ? "warning" : "pass") as PolicyCheckStatus,
      detail: item.blockers.length
        ? `${item.owner} must clear ${item.blockers.length} blocker(s).`
        : "No open blockers on the current approval route.",
    },
  ] as const;
}

export function policyCheckLabel(status: PolicyCheckStatus) {
  if (status === "pass") return "Pass";
  if (status === "warning") return "Review";
  return "Blocked";
}
