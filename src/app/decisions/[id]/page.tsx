import Link from "next/link";
import { notFound } from "next/navigation";
import { items } from "@/lib/dataset";
import { decideItem } from "@/lib/decision-engine";

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

function primaryDecisionLine(item: (typeof items)[number], result: ReturnType<typeof decideItem>, dominant: string) {
  if (result.policyResult) {
    return `${result.action.toUpperCase()} because ${result.policyResult.triggeredBy.toLowerCase()} forced a policy override.`;
  }

  if (result.requiresHumanReview) {
    return `REVIEW because low confidence blocks autonomous routing on a material-risk item.`;
  }

  if (item.complianceRisk === "high" && result.action !== "prioritize") {
    return `${result.action.toUpperCase()} because compliance threshold blocks prioritization.`;
  }

  return `${result.action.toUpperCase()} because ${dominant} outweighed the remaining signals under the current weights.`;
}

function explainRejection(item: (typeof items)[number], result: ReturnType<typeof decideItem>) {
  if (result.policyResult) {
    return `Policy override active: ${result.policyResult.triggeredBy} forced ${result.policyResult.action}.`;
  }

  if (item.complianceRisk === "high") {
    return "Prioritization blocked by compliance risk threshold.";
  }

  if (result.requiresHumanReview) {
    return "Manual review required due to low confidence conflict on a high-impact item.";
  }

  if (item.workloadScore > 0.7) {
    return "Priority upgrade rejected because workload pressure outweighed value capture.";
  }

  return "No higher-priority path justified under the current weighted policy profile.";
}

function alternativeActions(item: (typeof items)[number], result: ReturnType<typeof decideItem>) {
  return [
    `Approve -> rejected: ${item.complianceRisk === "high" ? "compliance risk exceeded safe threshold" : "current score did not justify approval"}`,
    `Prioritize -> blocked: ${result.requiresHumanReview ? "human review lock active" : item.complianceRisk === "high" ? "compliance constraint active" : "risk and workload constrained priority routing"}`,
    `Delay -> dominated: ${item.urgencyScore > 0.6 || item.valueEur > 2000 ? "urgency and revenue outweighed delay strategy" : "delay was less favorable than review path"}`,
  ];
}

function confidenceMeaning(item: (typeof items)[number]) {
  if (item.confidence >= 0.8) return "High confidence -> signal alignment is strong and the engine can act with low ambiguity.";
  if (item.confidence >= 0.6) return "Medium confidence -> recommendation is stable, but competing signals remain visible.";
  return "Low confidence -> conflicting signals detected. Human review recommended.";
}

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = items.find((entry) => entry.id === id);

  if (!item) notFound();

  const result = decideItem(item);
  const signals = signalRows(item);
  const dominant = Object.entries(result.scoreBreakdown)
    .filter(([key]) => key !== "total")
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];

  const factorBreakdown = [
    { label: "revenue", value: result.scoreBreakdown.revenue, positive: true },
    { label: "risk", value: result.scoreBreakdown.risk, positive: false },
    { label: "urgency", value: result.scoreBreakdown.urgency, positive: true },
    { label: "workload", value: result.scoreBreakdown.workload, positive: false },
  ];

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
                <span className={`badge badge-${result.action}`}>{result.action}</span>
                <span className="chip">confidence {formatPercent(item.confidence)}</span>
                <span className="chip">{item.complianceRisk} compliance risk</span>
                {result.requiresHumanReview ? <span className="lock-chip locked">human review</span> : null}
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
            <div className={`hero-value big-${result.action}`}>{result.action}</div>
            <div className="conflict-banner" style={{ marginTop: 12 }}>
              {primaryDecisionLine(item, result, dominant)}
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
                    <div className="subtle">{primaryDecisionLine(item, result, dominant)}</div>
                  </div>
                </div>
                <div className="trace-node">
                  <div className="trace-dot" />
                  <div className="trace-card">
                    <strong>Policy layer</strong>
                    <div className="subtle">{result.policyResult ? `${result.policyResult.triggeredBy} -> forced ${result.policyResult.action}` : "No hard-rule override triggered."}</div>
                  </div>
                </div>
                <div className="trace-node">
                  <div className="trace-dot" />
                  <div className="trace-card">
                    <strong>Weighted scoring</strong>
                    <div className="subtle">
                      revenue {result.scoreBreakdown.revenue.toFixed(2)} · risk {result.scoreBreakdown.risk.toFixed(2)} · urgency {result.scoreBreakdown.urgency.toFixed(2)} · workload {result.scoreBreakdown.workload.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="trace-node">
                  <div className="trace-dot" />
                  <div className="trace-card trace-accent">
                    <strong>Final score: {result.scoreBreakdown.total.toFixed(2)}</strong>
                    <div className={`big-action big-${result.action}`}>Decision: {result.action.toUpperCase()}</div>
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
                {explainRejection(item, result)}
              </div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Alternative Actions</h2></div>
              <div className="stack compact-stack">
                {alternativeActions(item, result).map((line) => (
                  <div className="queue-card" key={line}>{line}</div>
                ))}
              </div>
            </section>
          </div>

          <div className="column">
            <section className="panel compact-panel">
              <div className="panel-title"><h2>Controls</h2></div>
              <div className="control-actions">
                <button className="primary">Approve</button>
                <button>Delay</button>
                <button className="warn">Escalate</button>
                <button className="danger">Override</button>
              </div>
              <div style={{ height: 10 }} />
              <textarea defaultValue="Override reason required." />
              <div className="review-banner">Any override must be justified and auditable.</div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Confidence Meaning</h2></div>
              <div className="queue-card">{confidenceMeaning(item)}</div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Outcome Preview</h2></div>
              <div className="stack compact-stack">
                <div className="queue-card"><strong>Impact</strong><div className="queue-meta">EUR {item.financialImpactEur.toLocaleString()} under {result.action} workflow</div></div>
                <div className="queue-card"><strong>Compliance risk</strong><div className="queue-meta">{item.complianceRisk} risk</div></div>
                <div className="queue-card"><strong>Fallback</strong><div className="queue-meta">{result.requiresHumanReview ? "manual review required" : "autonomous path available"}</div></div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
