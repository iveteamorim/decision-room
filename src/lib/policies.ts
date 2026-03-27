import type { PolicyResult, WorkItem } from "@/types/decision";

export function applyPolicies(item: WorkItem): PolicyResult | undefined {
  if (item.riskScore >= 0.8) {
    return {
      action: "escalate",
      triggeredBy: "Critical Risk Escalation",
      reason: "Risk score crossed the escalation threshold.",
    };
  }

  if (item.confidence < 0.5 && item.riskScore >= 0.6) {
    return {
      action: "review",
      triggeredBy: "Low Confidence Human Review",
      reason: "High-risk item has insufficient confidence for autonomous action.",
    };
  }

  if (item.slaHours <= 2 && item.urgencyScore >= 0.85) {
    return {
      action: "prioritize",
      triggeredBy: "SLA Breach Prevention",
      reason: "Urgent item is approaching SLA breach.",
    };
  }

  return undefined;
}
