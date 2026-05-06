import type { PolicyResult, WorkItem } from "@/types/decision";

export function applyPolicies(item: WorkItem): PolicyResult | undefined {
  if (item.riskScore >= 0.82) {
    return {
      action: "review",
      triggeredBy: "High Risk Approval",
      reason: "Deal risk exceeds the auto-approval threshold; finance or legal review is required.",
    };
  }

  if (item.marginScore < 0.45 && item.valueEur >= 10000) {
    return {
      action: "negotiate",
      triggeredBy: "Margin Protection",
      reason: "Requested terms put margin below the approval threshold.",
    };
  }

  if (item.confidence < 0.5 && item.riskScore >= 0.6) {
    return {
      action: "review",
      triggeredBy: "Low Confidence Review",
      reason: "The system needs operator judgment before recommending the next action.",
    };
  }

  if (item.slaHours <= 2 && item.urgencyScore >= 0.85) {
    return {
      action: "review",
      triggeredBy: "Approval Deadline",
      reason: "The deal is approaching its approval deadline and needs owner review.",
    };
  }

  return undefined;
}
