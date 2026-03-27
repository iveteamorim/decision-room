export type WorkItemType = "lead" | "ticket" | "case";

export type DecisionAction =
  | "prioritize"
  | "review"
  | "delay"
  | "escalate"
  | "reject";

export type WorkItemStatus =
  | "new"
  | "pending"
  | "in_review"
  | "resolved";

export type RiskLevel = "low" | "medium" | "high";

export interface WorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  valueEur: number;
  riskScore: number;
  urgencyScore: number;
  workloadScore: number;
  confidence: number;
  slaHours: number;
  status: WorkItemStatus;
  financialImpactEur: number;
  complianceRisk: RiskLevel;
  operationalBlock: boolean;
}

export interface PolicyResult {
  action: DecisionAction;
  triggeredBy: string;
  reason: string;
}

export interface ScoreWeights {
  revenue: number;
  risk: number;
  urgency: number;
  workload: number;
}

export interface ScoreBreakdown {
  revenue: number;
  risk: number;
  urgency: number;
  workload: number;
  total: number;
}

export interface DecisionResult {
  itemId: string;
  action: DecisionAction;
  scoreBreakdown: ScoreBreakdown;
  rationale: string[];
  policyResult?: PolicyResult;
  requiresHumanReview: boolean;
}
