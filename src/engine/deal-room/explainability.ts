import type {
  DecisionAction,
  ExplanationStep,
  PolicyEvaluation,
  ScoringResult,
  WorkflowPlan,
  WorkItem,
} from "./types";

export function buildRationale(
  item: WorkItem,
  action: DecisionAction,
  scoring: ScoringResult,
  policyEvaluation: PolicyEvaluation,
  workflow: WorkflowPlan,
) {
  return [
    `Recommendation: ${action}`,
    `Composite score: ${scoring.breakdown.total.toFixed(2)}`,
    `Confidence: ${item.confidence.toFixed(2)}`,
    `AI-assisted flags: ${scoring.aiAssistedSignal.flags.join(", ")}`,
    policyEvaluation.decisivePolicy
      ? `Policy override: ${policyEvaluation.decisivePolicy.id} (${policyEvaluation.decisivePolicy.triggeredBy})`
      : "Policy override: none",
    `Workflow owner: ${workflow.owner}`,
    `Blocked checkpoints: ${workflow.checkpoints.filter((checkpoint) => checkpoint.status === "blocked").map((checkpoint) => checkpoint.label).join(", ") || "none"}`,
  ];
}

export function buildExplanation(
  item: WorkItem,
  action: DecisionAction,
  scoring: ScoringResult,
  policyEvaluation: PolicyEvaluation,
  workflow: WorkflowPlan,
): ExplanationStep[] {
  const strongestScore = [...scoring.evidence].sort((a, b) => b.contribution - a.contribution)[0];
  const matchedPolicies = policyEvaluation.trace.filter((entry) => entry.matched);
  const blockedCheckpoints = workflow.checkpoints.filter((checkpoint) => checkpoint.status === "blocked");

  return [
    {
      title: "Deterministic scoring",
      body: `${strongestScore.factor} is the strongest scoring contributor. ${strongestScore.explanation}`,
      source: "score",
    },
    {
      title: "Policy precedence",
      body: matchedPolicies.length
        ? `${matchedPolicies[0].id} matched first by precedence. ${matchedPolicies[0].reason}`
        : "No deterministic policy violation matched this deal.",
      source: "policy",
    },
    {
      title: "AI-assisted context",
      body: `${scoring.aiAssistedSignal.flags.join(", ")}. ${scoring.aiAssistedSignal.explanation}`,
      source: "score",
    },
    {
      title: "Approval chain",
      body: blockedCheckpoints.length
        ? `${blockedCheckpoints.map((checkpoint) => checkpoint.owner).join(", ")} must clear blocked checkpoints before execution.`
        : `No blocked checkpoint prevents the ${action} path.`,
      source: "workflow",
    },
    {
      title: "Operational consequence",
      body: workflow.sideEffects.join(" "),
      source: "workflow",
    },
    {
      title: "Stakeholder positions",
      body: item.stakeholders.map((stakeholder) => `${stakeholder.team}: ${stakeholder.position}`).join(" | "),
      source: "stakeholder",
    },
  ];
}
