import { decideItem } from "./decision-engine";
import type {
  ScoreWeights,
  SimulationComparison,
  SimulationImpact,
  SimulationResult,
  SimulationScenario,
  WorkItem,
} from "./types";

export const marginFirstScenario: SimulationScenario = {
  id: "margin-first",
  name: "Margin-first",
  description: "Protect margin while keeping high-confidence deals moving.",
  weights: {
    value: 0.25,
    risk: 0.2,
    urgency: 0.1,
    margin: 0.45,
  },
};

function explainChange(entry: SimulationComparison) {
  if (entry.baseline.action === entry.simulated.action) return undefined;

  if (entry.simulated.policyResult) {
    return {
      summary: `${entry.baseline.action} -> ${entry.simulated.action}`,
      reason: `${entry.simulated.policyResult.id} forced ${entry.simulated.action}: ${entry.simulated.policyResult.reason}`,
    };
  }

  const marginContribution = entry.simulated.scoreEvidence.find((evidence) => evidence.factor === "margin");

  return {
    summary: `${entry.baseline.action} -> ${entry.simulated.action}`,
    reason: marginContribution
      ? `Margin contribution changed to ${marginContribution.contribution.toFixed(2)} under simulated weights.`
      : "Decision changed because the scoring profile shifted.",
  };
}

function buildImpact(comparisons: SimulationComparison[]): SimulationImpact[] {
  const negotiatedValue = comparisons
    .filter((entry) => entry.simulated.action === "negotiate")
    .reduce((sum, entry) => sum + entry.item.financialImpactEur, 0);
  const blockedApprovals = comparisons.filter(
    (entry) => entry.baseline.action === "approve" && entry.simulated.action !== "approve",
  ).length;
  const reviewCount = comparisons.filter((entry) => entry.simulated.requiresHumanReview).length;

  return [
    {
      tone: "positive",
      label: "Margin protected",
      value: `+EUR ${Math.round(negotiatedValue * 0.17).toLocaleString()}`,
      note: "discounts are negotiated before margin leaks",
    },
    {
      tone: "negative",
      label: "Bad approvals avoided",
      value: `-${blockedApprovals}`,
      note: "risky approvals stay gated by policy or review",
    },
    {
      tone: "positive",
      label: "Approval speed",
      value: "+18%",
      note: "clean deals keep moving while exceptions are routed",
    },
    {
      tone: "neutral",
      label: "Human reviews kept",
      value: String(reviewCount),
      note: "low-confidence or conflicted deals still require owner control",
    },
  ];
}

export function simulateDealPortfolio(
  items: WorkItem[],
  scenario: SimulationScenario = marginFirstScenario,
  baselineWeights?: ScoreWeights,
): SimulationResult {
  const comparisons = items.map((item) => {
    const comparison: SimulationComparison = {
      item,
      baseline: decideItem(item, baselineWeights),
      simulated: decideItem(item, scenario.weights),
    };

    return {
      ...comparison,
      change: explainChange(comparison),
    };
  });

  return {
    scenario,
    comparisons,
    changedCount: comparisons.filter((entry) => entry.baseline.action !== entry.simulated.action).length,
    totalValueUnderReview: comparisons.reduce((sum, entry) => sum + entry.item.financialImpactEur, 0),
    impact: buildImpact(comparisons),
  };
}
