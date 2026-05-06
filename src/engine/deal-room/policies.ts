import type {
  PolicyEvaluation,
  PolicyResult,
  PolicySeverity,
  Team,
  WorkItem,
} from "./types";

interface PolicyRule {
  id: string;
  name: string;
  owner: Team;
  severity: PolicySeverity;
  precedence: number;
  checkpoint: string;
  when: (item: WorkItem) => boolean;
  result: (item: WorkItem) => Omit<PolicyResult, "id" | "owner" | "severity" | "precedence" | "checkpoint">;
}

export const approvalPolicyRegistry: PolicyRule[] = [
  {
    id: "POL-LEGAL-001",
    name: "Legal exposure guardrail",
    owner: "Legal",
    severity: "blocker",
    precedence: 100,
    checkpoint: "legal-review",
    when: (item) => item.riskScore >= 0.82,
    result: () => ({
      action: "review",
      triggeredBy: "High Risk Approval",
      reason: "Deal risk exceeds the auto-approval threshold; finance or legal review is required.",
    }),
  },
  {
    id: "POL-FIN-004",
    name: "Margin protection",
    owner: "Finance",
    severity: "blocker",
    precedence: 90,
    checkpoint: "finance-approval",
    when: (item) => item.marginScore < 0.45 && item.valueEur >= 10000,
    result: () => ({
      action: "negotiate",
      triggeredBy: "Margin Protection",
      reason: "Requested terms put margin below the approval threshold.",
    }),
  },
  {
    id: "POL-AI-002",
    name: "Low-confidence human review",
    owner: "Policy",
    severity: "warning",
    precedence: 70,
    checkpoint: "human-review",
    when: (item) => item.confidence < 0.5 && item.riskScore >= 0.6,
    result: () => ({
      action: "review",
      triggeredBy: "Low Confidence Review",
      reason: "The system needs operator judgment before recommending the next action.",
    }),
  },
  {
    id: "POL-REV-006",
    name: "Approval deadline escalation",
    owner: "Ops",
    severity: "warning",
    precedence: 60,
    checkpoint: "owner-escalation",
    when: (item) => item.slaHours <= 2 && item.urgencyScore >= 0.85,
    result: () => ({
      action: "review",
      triggeredBy: "Approval Deadline",
      reason: "The deal is approaching its approval deadline and needs owner review.",
    }),
  },
  {
    id: "POL-GOV-009",
    name: "Stakeholder disagreement",
    owner: "Policy",
    severity: "warning",
    precedence: 50,
    checkpoint: "cross-functional-review",
    when: (item) => new Set(item.stakeholders.map((stakeholder) => stakeholder.position)).size > 1,
    result: () => ({
      action: "review",
      triggeredBy: "Cross-functional Conflict",
      reason: "Stakeholder recommendations diverge, so the approval chain must be explicit.",
    }),
  },
];

export function evaluatePolicies(item: WorkItem): PolicyEvaluation {
  const trace = approvalPolicyRegistry.map((rule) => {
    const matched = rule.when(item);

    return {
      id: rule.id,
      name: rule.name,
      matched,
      severity: rule.severity,
      owner: rule.owner,
      reason: matched ? rule.result(item).reason : "Policy condition did not match this deal.",
      precedence: rule.precedence,
    };
  });

  const decisiveRule = approvalPolicyRegistry
    .filter((rule) => rule.when(item))
    .sort((a, b) => b.precedence - a.precedence)[0];

  if (!decisiveRule) {
    return { trace };
  }

  const result = decisiveRule.result(item);

  return {
    decisivePolicy: {
      id: decisiveRule.id,
      owner: decisiveRule.owner,
      severity: decisiveRule.severity,
      precedence: decisiveRule.precedence,
      checkpoint: decisiveRule.checkpoint,
      ...result,
    },
    trace,
  };
}

export function applyPolicies(item: WorkItem): PolicyResult | undefined {
  return evaluatePolicies(item).decisivePolicy;
}
