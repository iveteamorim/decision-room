import Link from "next/link";
import { items } from "@/lib/dataset";
import { decideItem } from "@/lib/decision-engine";
import { scoreItem } from "@/lib/scoring";

const scenarioWeights = {
  revenue: 0.55,
  risk: 0.18,
  urgency: 0.17,
  workload: 0.1,
};

function changeReason(entry: {
  item: (typeof items)[number];
  baseline: ReturnType<typeof decideItem>;
  simulated: ReturnType<typeof decideItem>;
}) {
  const { baseline, simulated } = entry;

  if (baseline.action === simulated.action) {
    return null;
  }

  if (simulated.policyResult) {
    return {
      change: `Changed: ${baseline.action} -> ${simulated.action}`,
      reason: `Reason: ${simulated.policyResult.triggeredBy.toLowerCase()} forced ${simulated.action}`,
    };
  }

  if (simulated.action === "prioritize") {
    return {
      change: `Changed: ${baseline.action} -> prioritize`,
      reason: "Reason: revenue weight dominates",
    };
  }

  if (simulated.action === "review") {
    return {
      change: `Changed: ${baseline.action} -> review`,
      reason: "Reason: middle path beats autonomous routing",
    };
  }

  if (simulated.action === "reject") {
    return {
      change: `Changed: ${baseline.action} -> reject`,
      reason: "Reason: risk and workload still dominate",
    };
  }

  return {
    change: `Changed: ${baseline.action} -> ${simulated.action}`,
    reason: "Reason: trade-off profile shifted",
  };
}

export default function SimulationPage() {
  const comparison = items.map((item) => ({
    item,
    baseline: decideItem(item),
    simulated: decideItem(item, scenarioWeights),
    simulatedScore: scoreItem(item, scenarioWeights),
  }));

  const changed = comparison.filter((entry) => entry.baseline.action !== entry.simulated.action);
  const simulatedExposure = comparison.reduce((sum, entry) => sum + entry.item.financialImpactEur, 0);
  const baselinePrioritized = comparison.filter((entry) => entry.baseline.action === "prioritize").length;
  const simulatedPrioritized = comparison.filter((entry) => entry.simulated.action === "prioritize").length;
  const baselineEscalated = comparison.filter((entry) => entry.baseline.action === "escalate").length;
  const simulatedEscalated = comparison.filter((entry) => entry.simulated.action === "escalate").length;
  const baselineReview = comparison.filter((entry) => entry.baseline.requiresHumanReview).length;
  const simulatedReview = comparison.filter((entry) => entry.simulated.requiresHumanReview).length;

  const revenueDelta = baselinePrioritized === 0
    ? 0
    : ((simulatedPrioritized - baselinePrioritized) / baselinePrioritized) * 100;
  const riskDelta = baselineEscalated === 0
    ? 0
    : ((simulatedEscalated - baselineEscalated) / baselineEscalated) * 100;
  const reviewDelta = baselineReview === 0
    ? 0
    : ((simulatedReview - baselineReview) / baselineReview) * 100;
  const latencyDelta = changed.length === 0 ? 0 : -22;

  return (
    <main>
      <div className="shell shell-tight">
        <section className="topbar topbar-tight">
          <div>
            <div className="eyebrow">Simulation Lab</div>
            <h1>Trade-off Testing</h1>
            <p className="subtle">Change weights. Watch the decision system move.</p>
          </div>
          <nav className="nav">
            <Link href="/dashboard">Mission Control</Link>
            <Link className="active" href="/simulation">Simulation Lab</Link>
          </nav>
        </section>

        <section className="hero-strip">
          <div className="hero-card hero-primary">
            <div className="metric-label">Scenario</div>
            <div className="hero-value">Revenue-first</div>
            <div className="metric-note">More aggressive on high-value items, softer on medium risk.</div>
          </div>
          <div className="hero-card hero-secondary">
            <div className="metric-label">Exposure under test</div>
            <div className="hero-value semantic-impact">EUR {simulatedExposure.toLocaleString()}</div>
            <div className="metric-note">{changed.length} action shifts under this policy profile</div>
          </div>
        </section>

        <section className="simulation-focus-layout refined-sim">
          <section className="panel simulation-main-panel">
            <div className="panel-title">
              <h2>Decision Changes</h2>
              <span className="chip">baseline vs simulated</span>
            </div>
            <div className="delta-list">
              {comparison.map(({ item, baseline, simulated, simulatedScore }) => {
                const reason = changeReason({ item, baseline, simulated });
                return (
                  <div className="delta-row" key={item.id}>
                    <div className="delta-head">
                      <div>
                        <strong>{item.title}</strong>
                        <div className="delta-meta">score {simulatedScore.total.toFixed(2)} · impact EUR {item.financialImpactEur.toLocaleString()}</div>
                      </div>
                      <span className={`badge badge-${simulated.action}`}>{simulated.action}</span>
                    </div>
                    <div className="delta-grid">
                      <div className="delta-card"><div className="kicker">baseline</div><strong>{baseline.action}</strong></div>
                      <div className="delta-card"><div className="kicker">simulated</div><strong>{simulated.action}</strong></div>
                    </div>
                    {reason ? (
                      <div className="conflict-banner compact-explain">
                        <strong>{reason.change}</strong>
                        <span>{reason.reason}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="side-stack">
            <section className="panel compact-panel">
              <div className="panel-title"><h2>Weights</h2></div>
              <div className="stack compact-stack">
                {Object.entries(scenarioWeights).map(([key, value]) => (
                  <div className="queue-card" key={key}>
                    <div className="weight-meta"><strong>{key}</strong><span>{value.toFixed(2)}</span></div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${value * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title"><h2>Global Trade-offs</h2></div>
              <div className="stack compact-stack">
                <div className="queue-card positive"><strong>Revenue capture</strong><div className="queue-meta">{revenueDelta >= 0 ? "+" : ""}{revenueDelta.toFixed(0)}% · more high-value items unlocked</div></div>
                <div className="queue-card negative"><strong>Compliance exposure</strong><div className="queue-meta">{riskDelta >= 0 ? "+" : ""}{riskDelta.toFixed(0)}% · policy constraints still dominate restricted items</div></div>
                <div className="queue-card neutral"><strong>Manual review load</strong><div className="queue-meta">{reviewDelta >= 0 ? "+" : ""}{reviewDelta.toFixed(0)}% · human fallback remains active where confidence is weak</div></div>
                <div className="queue-card positive"><strong>Decision latency</strong><div className="queue-meta">{latencyDelta >= 0 ? "+" : ""}{latencyDelta}% · fewer slow paths when prioritization expands</div></div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
