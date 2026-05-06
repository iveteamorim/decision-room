export type WorkItemType = "discount" | "renewal" | "contract" | "expansion";

export type DecisionAction =
  | "approve"
  | "negotiate"
  | "review"
  | "reject";

export type WorkItemStatus =
  | "new"
  | "pending"
  | "in_review"
  | "resolved";

export type RiskLevel = "low" | "medium" | "high";

export type Team = "Sales" | "Finance" | "Legal" | "Ops" | "Policy";

export type ApprovalState =
  | "awaiting_approval"
  | "policy_conflict"
  | "legal_review"
  | "ready_to_send"
  | "terms_rejected";

export interface StakeholderPosition {
  team: Team;
  position: DecisionAction;
  note: string;
}

export interface AuditEvent {
  time: string;
  actor: Team | "System";
  event: string;
  tone: "neutral" | "warning" | "success" | "danger";
}

export interface WorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  valueEur: number;
  riskScore: number;
  urgencyScore: number;
  marginScore: number;
  confidence: number;
  slaHours: number;
  status: WorkItemStatus;
  financialImpactEur: number;
  decisionRisk: RiskLevel;
  policyBlock: boolean;
  approvalState: ApprovalState;
  owner: Team;
  blockers: string[];
  stakeholders: StakeholderPosition[];
  auditTrail: AuditEvent[];
}

export interface PolicyResult {
  action: DecisionAction;
  triggeredBy: string;
  reason: string;
}

export interface ScoreWeights {
  value: number;
  risk: number;
  urgency: number;
  margin: number;
}

export interface ScoreBreakdown {
  value: number;
  risk: number;
  urgency: number;
  margin: number;
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
