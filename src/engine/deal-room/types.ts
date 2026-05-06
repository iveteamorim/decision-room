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

export type PolicySeverity = "info" | "warning" | "blocker";

export type CheckpointStatus = "open" | "passed" | "blocked" | "not_required";

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
  id: string;
  action: DecisionAction;
  triggeredBy: string;
  reason: string;
  owner: Team;
  severity: PolicySeverity;
  checkpoint: string;
  precedence: number;
}

export interface PolicyTraceEntry {
  id: string;
  name: string;
  matched: boolean;
  severity: PolicySeverity;
  owner: Team;
  reason: string;
  precedence: number;
}

export interface PolicyEvaluation {
  decisivePolicy?: PolicyResult;
  trace: PolicyTraceEntry[];
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

export type ScoreFactor = keyof Omit<ScoreBreakdown, "total">;

export interface ScoreEvidence {
  factor: ScoreFactor;
  raw: number;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface AiAssistedSignal {
  mode: "deterministic-adapter";
  confidenceAdjustment: number;
  flags: string[];
  explanation: string;
}

export interface ScoringResult {
  breakdown: ScoreBreakdown;
  evidence: ScoreEvidence[];
  aiAssistedSignal: AiAssistedSignal;
}

export interface WorkflowCheckpoint {
  id: string;
  label: string;
  owner: Team;
  status: CheckpointStatus;
  required: boolean;
  reason: string;
}

export interface WorkflowPlan {
  state: ApprovalState;
  owner: Team;
  checkpoints: WorkflowCheckpoint[];
  nextActions: string[];
  sideEffects: string[];
}

export interface ExplanationStep {
  title: string;
  body: string;
  source: "policy" | "score" | "workflow" | "stakeholder" | "simulation";
}

export interface DecisionResult {
  itemId: string;
  action: DecisionAction;
  scoreBreakdown: ScoreBreakdown;
  scoreEvidence: ScoreEvidence[];
  rationale: string[];
  explanation: ExplanationStep[];
  policyResult?: PolicyResult;
  policyTrace: PolicyTraceEntry[];
  workflow: WorkflowPlan;
  aiAssistedSignal: AiAssistedSignal;
  requiresHumanReview: boolean;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  weights: ScoreWeights;
}

export interface SimulationComparison {
  item: WorkItem;
  baseline: DecisionResult;
  simulated: DecisionResult;
  change?: {
    summary: string;
    reason: string;
  };
}

export interface SimulationImpact {
  tone: "positive" | "negative" | "neutral";
  label: string;
  value: string;
  note: string;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  comparisons: SimulationComparison[];
  changedCount: number;
  totalValueUnderReview: number;
  impact: SimulationImpact[];
}
