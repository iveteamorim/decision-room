"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { items } from "@/lib/dataset";
import { decideItem } from "@/lib/decision-engine";
import type { DecisionAction } from "@/types/decision";

function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function signalRows(item: (typeof items)[number]) {
  return [
    { label: "Revenue", value: Math.min(item.valueEur / 25000, 1) },
    { label: "Risk", value: item.riskScore },
    { label: "Urgency", value: item.urgencyScore },
    { label: "Workload", value: item.workloadScore },
  ];
}

function primaryDecisionLine(
  item: (typeof items)[number],
  action: DecisionAction,
  dominant: string,
  manualNote?: string,
  policyLabel?: string,
) {
  if (manualNote) {
    return manualNote;
  }

  if (policyLabel && action === "escalate") {
    return `${action.toUpperCase()} because ${policyLabel.toLowerCase()} forced a policy override.`;
  }

  if (item.confidence < 0.55 && action === "review") {
    return "REVIEW because confidence is too low for autonomous routing.";
  }

  if (item.complianceRisk === "high" && action !== "prioritize") {
    return `${action.toUpperCase()} because compliance threshold blocks prioritization.`;
  }

  return `${action.toUpperCase()} because ${dominant} outweighed the remaining signals under the current weights.`;
}

function explainRejection(
  item: (typeof items)[number],
  action: DecisionAction,
  requiresHumanReview: boolean,
  policyLabel?: string,
) {
  if (policyLabel) {
    return `Policy override active: ${policyLabel} forced ${action}.`;
  }

  if (item.complianceRisk === "high" && action !== "prioritize") {
    return "Prioritization blocked by compliance risk threshold.";
  }

  if (requiresHumanReview) {
    return "Manual review required due to confidence conflict.";
  }

  if (item.workloadScore > 0.7) {
    return "Priority upgrade blocked by workload pressure.";
  }

  return "No higher-priority path justified.";
}

function alternativeActions(
  item: (typeof items)[number],
  requiresHumanReview: boolean,
  action: DecisionAction,
) {
  return [
    `Approve -> rejected: ${item.complianceRisk === "high" && action !== "prioritize" ? "compliance risk exceeded safe threshold" : "current path does not justify full autonomous approval"}`,
    `Prioritize -> blocked: ${requiresHumanReview ? "human review lock active" : item.complianceRisk === "high" && action !== "prioritize" ? "compliance constraint active" : "risk and workload constrained priority routing"}`,
    `Delay -> dominated: ${item.urgencyScore > 0.6 || item.valueEur > 2000 ? "urgency and revenue outweighed delay strategy" : "delay was less favorable than review path"}`,
  ];
}

function confidenceMeaning(item: (typeof items)[number], requiresHumanReview: boolean) {
  if (!requiresHumanReview && item.confidence >= 0.8) {
    return "High confidence -> low ambiguity.";
  }
  if (!requiresHumanReview && item.confidence >= 0.6) {
    return "Medium confidence -> stable recommendation.";
  }
  return "Low confidence -> human review recommended.";
}

function actionTone(action: DecisionAction) {
  if (action === "prioritize") return "positive";
  if (action === "escalate" || action === "reject") return "negative";
  if (action === "review") return "neutral";
  return "muted";
}

type EventEntry = {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "negative" | "neutral" | "muted";
};

export default function DecisionPage() {
  const params = useParams<{ id: string }>();
  const item = items.find((entry) => entry.id === params.id);

  const base = useMemo(() => (item ? decideItem(item) : null), [item]);
  const dominant = useMemo(() => {
    if (!base) return "revenue";
    return Object.entries(base.scoreBreakdown)
      .filter(([key]) => key !== "total")
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];
  }, [base]);

  const [currentAction, setCurrentAction] = useState<DecisionAction | null>(base?.action ?? null);
  const [requiresHumanReview, setRequiresHumanReview] = useState(base?.requiresHumanReview ?? false);
  const [overrideReason, setOverrideReason] = useState("");
  const [operatorSummary, setOperatorSummary] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<EventEntry[]>(
    base && item
      ? [
          {
            id: "engine-default",
            title: "Engine recommendation loaded",
            detail: primaryDecisionLine(item, base.action, dominant, undefined, base.policyResult?.triggeredBy),
            tone: "neutral",
          },
        ]
      : [],
  );

  if (!item || !base || !currentAction) {
    return (
      <main>
        <div className="shell shell-tight">
          <section className="topbar topbar-tight">
            <div>
              <div className="eyebrow">Decision Workspace</div>
              <h1>Case not found</h1>
              <p className="subtle">The requested decision workspace does not exist in the demo dataset.</p>
            </div>
            <nav className="nav">
              <Link href="/dashboard">Mission Control</Link>
              <Link href="/simulation">Simulation Lab</Link>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const signals = signalRows(item);
  const factorBreakdown = [
    { label: "revenue", value: base.scoreBreakdown.revenue, positive: true },
    { label: "risk", value: base.scoreBreakdown.risk, positive: false },
    { label: "urgency", value: base.scoreBreakdown.urgency, positive: true },
    { label: "workload", value: base.scoreBreakdown.workload, positive: false },
  ];

  const decisionLine = primaryDecisionLine(
    item,
    currentAction,
    dominant,
    operatorSummary ?? undefined,
    base.policyResult?.triggeredBy,
  );

  function appendEvent(title: string, detail: string, tone: EventEntry["tone"]) {
    setEventLog((previous) => [
      {
        id: `${Date.now()}-${previous.length}`,
        title,
        detail,
        tone,
      },
      ...previous,
    ]);
  }

  function applyOperatorAction(nextAction: DecisionAction, title: string, detail: string) {
    setCurrentAction(nextAction);
    setRequiresHumanReview(false);
    setOperatorSummary(detail);
    appendEvent(title, detail, actionTone(nextAction));
  }

  function handleApprove() {
    applyOperatorAction("prioritize", "Operator approved priority path", "Priority path approved by operator.");
  }

  function handleDelay() {
    applyOperatorAction("delay", "Operator delayed action", "Delay applied by operator.");
  }

  function handleEscalate() {
    applyOperatorAction("escalate", "Operator escalated item", "Escalated by operator.");
  }

  function handleOverride() {
    const reason = overrideReason.trim();
    if (!reason) {
      setOperatorSummary("Override blocked: justification required.");
      appendEvent(
        "Override blocked",
        "Override rejected: missing reason.",
        "negative",
      );
      return;
    }

    applyOperatorAction(
      "prioritize",
      "Manual override applied",
      `OVERRIDE forced prioritize after manual review. Reason: ${reason}`,
    );
    setOverrideReason("");
  }

  return (
    <main>
      <div className="shell shell-tight">
        <section className="topbar topbar-tight">
          <div>
            <div className="eyebrow">Decision Workspace</div>
            <div className="case-header">
              <div>
                <h1>{item.title}</h1>
                <p className="subtle">{item.type} · {item.id} · {item.status}</p>
              </div>
              <div className="chip-row">
                <span className={`badge badge-${currentAction}`}>{currentAction}</span>
                <span className="chip">confidence {formatPercent(item.confidence)}</span>
                <span className="chip">{item.complianceRisk} compliance risk</span>
                {requiresHumanReview ? <span className="lock-chip locked">human review</span> : <span className="lock-chip">operator cleared</span>}
              </div>
            </div>
          </div>
          <nav className="nav">
            <Link href="/dashboard">Mission Control</Link>
            <Link href="/simulation">Simulation Lab</Link>
          </nav>
        </section>

        <section className="workspace-hero">
          <div className="hero-card hero-primary">
            <div className="metric-label">Recommended action</div>
            <div className={`hero-value big-${currentAction}`}>{currentAction}</div>
            <div className="conflict-banner" style={{ marginTop: 12 }}>
              {decisionLine}
            </div>
          </div>
          <div className="hero-card hero-secondary">
            <div className="metric-label">Impact layer</div>
            <div className="hero-value">EUR {item.financialImpactEur.toLocaleString()}</div>
            <div className="metric-note">{item.operationalBlock ? "Operational block active" : "No operational block"}</div>
          </div>
        </section>

        <section className="workspace-grid refined-workspace">
          <div className="column">
            <section className="panel compact-panel">
              <div className="panel-title"><h2>Signal Stack</h2></div>
              <div className="signal-stack">
                {signals.map((signal) => (
                  <div className="signal-card" key={signal.label}>
                    <div className="signal-head">
                      <strong>{signal.label}</strong>
                      <span>{formatPercent(signal.value)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${signal.value * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Case File</h2></div>
              <div className="stack compact-stack">
                <div className="queue-card"><strong>Value</strong><div className="queue-meta">EUR {item.valueEur.toLocaleString()}</div></div>
                <div className="queue-card"><strong>Financial impact</strong><div className="queue-meta">EUR {item.financialImpactEur.toLocaleString()}</div></div>
                <div className="queue-card"><strong>SLA</strong><div className="queue-meta">{item.slaHours}h to breach</div></div>
                <div className="queue-card"><strong>Block state</strong><div className="queue-meta">{item.operationalBlock ? "blocked" : "not blocked"}</div></div>
              </div>
            </section>
          </div>

          <div className="column workspace-main-column">
            <section className="panel graph-panel">
              <div className="panel-title">
                <h2>Decision Logic</h2>
                <span className="chip">Decision Engine v1</span>
              </div>
              <div className="trace-list trace-strong">
                <div className="trace-node">
                  <div className="trace-dot" />
                  <div className="trace-card">
                    <strong>Primary reason</strong>
                    <div className="subtle">{decisionLine}</div>
                  </div>
                </div>
                <div className="trace-node">
                  <div className="trace-dot" />
                  <div className="trace-card">
                    <strong>Policy layer</strong>
                    <div className="subtle">{base.policyResult ? `${base.policyResult.triggeredBy} -> forced ${base.policyResult.action}` : "No hard-rule override triggered."}</div>
                  </div>
                </div>
                <div className="trace-node">
                  <div className="trace-dot" />
                  <div className="trace-card">
                    <strong>Weighted scoring</strong>
                    <div className="subtle">
                      revenue {base.scoreBreakdown.revenue.toFixed(2)} · risk {base.scoreBreakdown.risk.toFixed(2)} · urgency {base.scoreBreakdown.urgency.toFixed(2)} · workload {base.scoreBreakdown.workload.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="trace-node">
                  <div className="trace-dot" />
                  <div className="trace-card trace-accent">
                    <strong>Final score: {base.scoreBreakdown.total.toFixed(2)}</strong>
                    <div className={`big-action big-${currentAction}`}>Decision: {currentAction.toUpperCase()}</div>
                    <div className="subtle">thresholds: prioritize &gt; 0.72 · review 0.56-0.72 · delay 0.40-0.56 · reject &lt; 0.40</div>
                  </div>
                </div>
              </div>

              <div className="rationale-grid" style={{ marginTop: 16 }}>
                {factorBreakdown.map((factor) => (
                  <div className="delta-card" key={factor.label}>
                    <div className="kicker">{factor.label}</div>
                    <strong>{factor.positive ? "+" : "-"}{factor.value.toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className="conflict-banner" style={{ marginTop: 14 }}>
                {explainRejection(item, currentAction, requiresHumanReview, base.policyResult?.triggeredBy)}
              </div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Alternative Actions</h2></div>
              <div className="stack compact-stack">
                {alternativeActions(item, requiresHumanReview, currentAction).map((line) => (
                  <div className="queue-card" key={line}>{line}</div>
                ))}
              </div>
            </section>
          </div>

          <div className="column">
            <section className="panel compact-panel">
              <div className="panel-title"><h2>Controls</h2></div>
              <div className="control-actions">
                <button className="primary" onClick={handleApprove} type="button">Approve</button>
                <button onClick={handleDelay} type="button">Delay</button>
                <button className="warn" onClick={handleEscalate} type="button">Escalate</button>
                <button className="danger" onClick={handleOverride} type="button">Override</button>
              </div>
              <div style={{ height: 10 }} />
              <textarea
                placeholder="Override reason required."
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
              />
              <div className="review-banner">Overrides require justification.</div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Confidence Meaning</h2></div>
              <div className="queue-card">{confidenceMeaning(item, requiresHumanReview)}</div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Outcome Preview</h2></div>
              <div className="stack compact-stack">
                <div className="queue-card"><strong>Impact</strong><div className="queue-meta">EUR {item.financialImpactEur.toLocaleString()} under {currentAction} workflow</div></div>
                <div className="queue-card"><strong>Compliance risk</strong><div className="queue-meta">{item.complianceRisk} risk</div></div>
                <div className="queue-card"><strong>Fallback</strong><div className="queue-meta">{requiresHumanReview ? "manual review required" : "operator decision active"}</div></div>
              </div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Event Log</h2></div>
              <div className="stack compact-stack">
                {eventLog.map((entry) => (
                  <div className={`queue-card event-card ${entry.tone}`} key={entry.id}>
                    <strong>{entry.title}</strong>
                    <div className="queue-meta">{entry.detail}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
