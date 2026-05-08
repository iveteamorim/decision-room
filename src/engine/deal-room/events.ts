import type {
  DecisionAction,
  DecisionEvent,
  DecisionEventSeverity,
  DecisionLedger,
  DecisionReplay,
  PolicyEvaluation,
  ScoringResult,
  Team,
  WorkflowCheckpoint,
  WorkflowPlan,
  WorkItem,
} from "./types";

const LEDGER_TIMESTAMP = "2026-05-06T00:00:00.000Z";

function eventId(dealId: string, index: number, type: string) {
  return `${dealId}:${String(index).padStart(2, "0")}:${type}`;
}

function severityForCheckpoint(checkpoint: WorkflowCheckpoint): DecisionEventSeverity {
  if (checkpoint.status === "blocked") return "critical";
  if (checkpoint.status === "open") return "warning";
  return "info";
}

function policyIds(policyEvaluation: PolicyEvaluation) {
  return policyEvaluation.trace
    .filter((entry) => entry.matched)
    .map((entry) => entry.id);
}

function confidenceWithAdjustment(item: WorkItem, scoring: ScoringResult) {
  return Math.max(
    0,
    Math.min(1, item.confidence + scoring.aiAssistedSignal.confidenceAdjustment),
  );
}

function checkpointEventType(checkpoint: WorkflowCheckpoint) {
  return checkpoint.status === "blocked" ? "checkpoint_blocked" : "checkpoint_opened";
}

export function buildDecisionEvents(params: {
  item: WorkItem;
  action: DecisionAction;
  scoring: ScoringResult;
  policyEvaluation: PolicyEvaluation;
  workflow: WorkflowPlan;
}): DecisionEvent[] {
  const { item, action, scoring, policyEvaluation, workflow } = params;
  const matchedPolicyIds = policyIds(policyEvaluation);
  const adjustedConfidence = confidenceWithAdjustment(item, scoring);
  const requiredCheckpoints = workflow.checkpoints.filter((checkpoint) => checkpoint.required);
  const events: DecisionEvent[] = [
    {
      id: eventId(item.id, 1, "deal_intaken"),
      type: "deal_intaken",
      dealId: item.id,
      occurredAt: LEDGER_TIMESTAMP,
      actor: "System",
      owner: item.owner,
      severity: item.blockers.length ? "warning" : "info",
      confidence: item.confidence,
      reason: "Deal entered the approval operating system with structured commercial and risk inputs.",
      policyIds: [],
      checkpointIds: [],
      metadata: {
        valueEur: item.valueEur,
        marginScore: item.marginScore,
        riskScore: item.riskScore,
        urgencyScore: item.urgencyScore,
        blockerCount: item.blockers.length,
      },
    },
    {
      id: eventId(item.id, 2, "policy_evaluated"),
      type: "policy_evaluated",
      dealId: item.id,
      occurredAt: LEDGER_TIMESTAMP,
      actor: "Policy",
      owner: policyEvaluation.decisivePolicy?.owner ?? workflow.owner,
      severity: policyEvaluation.decisivePolicy?.severity === "blocker" ? "critical" : matchedPolicyIds.length ? "warning" : "info",
      action: policyEvaluation.decisivePolicy?.action,
      confidence: item.confidence,
      reason: policyEvaluation.decisivePolicy
        ? policyEvaluation.decisivePolicy.reason
        : "No deterministic policy violation matched.",
      policyIds: matchedPolicyIds,
      checkpointIds: policyEvaluation.decisivePolicy ? [policyEvaluation.decisivePolicy.checkpoint] : [],
      metadata: {
        matchedPolicies: matchedPolicyIds.length,
        decisivePolicy: policyEvaluation.decisivePolicy?.id ?? null,
        precedence: policyEvaluation.decisivePolicy?.precedence ?? null,
      },
    },
    {
      id: eventId(item.id, 3, "score_calculated"),
      type: "score_calculated",
      dealId: item.id,
      occurredAt: LEDGER_TIMESTAMP,
      actor: "System",
      owner: workflow.owner,
      severity: adjustedConfidence < 0.55 ? "warning" : "info",
      confidence: adjustedConfidence,
      reason: scoring.aiAssistedSignal.explanation,
      policyIds: matchedPolicyIds,
      checkpointIds: [],
      metadata: {
        totalScore: scoring.breakdown.total,
        confidenceAdjustment: scoring.aiAssistedSignal.confidenceAdjustment,
        aiSignalFlags: scoring.aiAssistedSignal.flags.join("; "),
      },
    },
  ];

  requiredCheckpoints.forEach((checkpoint, index) => {
    events.push({
      id: eventId(item.id, index + 4, checkpointEventType(checkpoint)),
      type: checkpointEventType(checkpoint),
      dealId: item.id,
      occurredAt: LEDGER_TIMESTAMP,
      actor: "System",
      owner: checkpoint.owner,
      severity: severityForCheckpoint(checkpoint),
      confidence: adjustedConfidence,
      reason: checkpoint.reason,
      policyIds: matchedPolicyIds,
      checkpointIds: [checkpoint.id],
      metadata: {
        checkpointStatus: checkpoint.status,
        checkpointRequired: checkpoint.required,
      },
    });
  });

  const escalationNeeded = workflow.checkpoints.some((checkpoint) => checkpoint.status === "blocked") || action === "review";

  if (escalationNeeded) {
    events.push({
      id: eventId(item.id, events.length + 1, "deal_escalated"),
      type: "deal_escalated",
      dealId: item.id,
      occurredAt: LEDGER_TIMESTAMP,
      actor: "System",
      owner: workflow.owner,
      severity: "warning",
      action,
      confidence: adjustedConfidence,
      reason: `Escalated to ${workflow.owner} because approval requires explicit human control.`,
      policyIds: matchedPolicyIds,
      checkpointIds: workflow.checkpoints
        .filter((checkpoint) => checkpoint.status === "blocked" || checkpoint.status === "open")
        .map((checkpoint) => checkpoint.id),
      metadata: {
        nextActionCount: workflow.nextActions.length,
        sideEffectCount: workflow.sideEffects.length,
      },
    });
  }

  events.push({
    id: eventId(item.id, events.length + 1, "approval_recommended"),
    type: "approval_recommended",
    dealId: item.id,
    occurredAt: LEDGER_TIMESTAMP,
    actor: "System",
    owner: workflow.owner,
    severity: action === "reject" ? "critical" : action === "review" || action === "negotiate" ? "warning" : "info",
    action,
    confidence: adjustedConfidence,
    reason: `Final recommendation is ${action} after policy, scoring, and workflow checks.`,
    policyIds: matchedPolicyIds,
    checkpointIds: requiredCheckpoints.map((checkpoint) => checkpoint.id),
    metadata: {
      totalScore: scoring.breakdown.total,
      requiresOwnerReview: escalationNeeded,
    },
  });

  return events;
}

export function buildDecisionLedger(params: {
  item: WorkItem;
  action: DecisionAction;
  scoring: ScoringResult;
  policyEvaluation: PolicyEvaluation;
  workflow: WorkflowPlan;
}): DecisionLedger {
  const events = buildDecisionEvents(params);
  const blockedCheckpointIds = params.workflow.checkpoints
    .filter((checkpoint) => checkpoint.status === "blocked")
    .map((checkpoint) => checkpoint.id);
  const openCheckpointIds = params.workflow.checkpoints
    .filter((checkpoint) => checkpoint.status === "open")
    .map((checkpoint) => checkpoint.id);
  const matchedPolicyIds = policyIds(params.policyEvaluation);

  return {
    dealId: params.item.id,
    currentOwner: params.workflow.owner,
    openCheckpointIds,
    blockedCheckpointIds,
    matchedPolicyIds,
    latestRecommendation: params.action,
    latestConfidence: confidenceWithAdjustment(params.item, params.scoring),
    events,
  };
}

export function replayDecisionLedger(ledger: DecisionLedger): DecisionReplay {
  const recommendationEvent = [...ledger.events]
    .reverse()
    .find((event) => event.type === "approval_recommended");
  const ownerEvent = [...ledger.events]
    .reverse()
    .find((event) => event.owner);

  return {
    dealId: ledger.dealId,
    eventCount: ledger.events.length,
    finalOwner: ownerEvent?.owner ?? ledger.currentOwner,
    finalRecommendation: recommendationEvent?.action,
    matchedPolicyIds: Array.from(new Set(ledger.events.flatMap((event) => event.policyIds))),
    blockedCheckpointIds: Array.from(new Set(ledger.events.flatMap((event) => event.checkpointIds))).filter((checkpointId) =>
      ledger.blockedCheckpointIds.includes(checkpointId),
    ),
    confidenceTimeline: ledger.events.map((event) => ({
      eventId: event.id,
      confidence: event.confidence,
      reason: event.reason,
    })),
  };
}
