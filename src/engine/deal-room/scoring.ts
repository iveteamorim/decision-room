import type {
  AiAssistedSignal,
  ScoreBreakdown,
  ScoreEvidence,
  ScoreWeights,
  ScoringResult,
  WorkItem,
} from "./types";

export const defaultWeights: ScoreWeights = {
  value: 0.35,
  risk: 0.25,
  urgency: 0.15,
  margin: 0.25,
};

function normalizeValue(valueEur: number) {
  return Math.min(valueEur / 75000, 1);
}

function stakeholderConflictCount(item: WorkItem) {
  return new Set(item.stakeholders.map((stakeholder) => stakeholder.position)).size;
}

export function extractAiAssistedSignals(item: WorkItem): AiAssistedSignal {
  const flags: string[] = [];
  let confidenceAdjustment = 0;

  if (item.blockers.length > 0) {
    flags.push(`${item.blockers.length} open blocker${item.blockers.length === 1 ? "" : "s"}`);
    confidenceAdjustment -= 0.04;
  }

  if (stakeholderConflictCount(item) > 1) {
    flags.push("stakeholder disagreement detected");
    confidenceAdjustment -= 0.06;
  }

  if (item.auditTrail.some((event) => event.tone === "danger")) {
    flags.push("recent high-severity audit event");
    confidenceAdjustment -= 0.05;
  }

  if (flags.length === 0) {
    flags.push("no unstructured risk flags");
    confidenceAdjustment += 0.02;
  }

  return {
    mode: "deterministic-adapter",
    confidenceAdjustment,
    flags,
    explanation:
      "Operational context is converted into deterministic confidence adjustments. A production adapter can replace this with LLM extraction without changing the scoring contract.",
  };
}

export function scoreDeal(
  item: WorkItem,
  weights: ScoreWeights = defaultWeights,
): ScoringResult {
  const aiAssistedSignal = extractAiAssistedSignals(item);
  const adjustedConfidence = Math.max(
    0,
    Math.min(1, item.confidence + aiAssistedSignal.confidenceAdjustment),
  );

  const rawValue = normalizeValue(item.valueEur);
  const rawRiskControl = 1 - item.riskScore;
  const rawUrgency = item.urgencyScore;
  const rawMargin = item.marginScore * adjustedConfidence;

  const breakdown: ScoreBreakdown = {
    value: rawValue * weights.value,
    risk: rawRiskControl * weights.risk,
    urgency: rawUrgency * weights.urgency,
    margin: rawMargin * weights.margin,
    total: 0,
  };
  breakdown.total = breakdown.value + breakdown.risk + breakdown.urgency + breakdown.margin;

  const evidence: ScoreEvidence[] = [
    {
      factor: "value",
      raw: rawValue,
      weight: weights.value,
      contribution: breakdown.value,
      explanation: `Deal value normalizes to ${rawValue.toFixed(2)} against the approval portfolio ceiling.`,
    },
    {
      factor: "risk",
      raw: rawRiskControl,
      weight: weights.risk,
      contribution: breakdown.risk,
      explanation: `Risk control is ${(rawRiskControl * 100).toFixed(0)}%, so higher deal risk reduces approval readiness.`,
    },
    {
      factor: "urgency",
      raw: rawUrgency,
      weight: weights.urgency,
      contribution: breakdown.urgency,
      explanation: `Urgency contributes because the approval window is ${item.slaHours}h.`,
    },
    {
      factor: "margin",
      raw: rawMargin,
      weight: weights.margin,
      contribution: breakdown.margin,
      explanation: `Margin is adjusted by operational confidence to avoid approving weak-context deals.`,
    },
  ];

  return { breakdown, evidence, aiAssistedSignal };
}
