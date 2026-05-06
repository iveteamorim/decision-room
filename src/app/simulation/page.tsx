import Link from "next/link";
import { items } from "@/lib/dataset";
import { decideItem } from "@/lib/decision-engine";
import { scoreItem } from "@/lib/scoring";

const scenarioWeights = {
  value: 0.25,
  risk: 0.2,
  urgency: 0.1,
  margin: 0.45,
};

const businessImpact = [
  {
    tone: "positive",
    label: "Margin protected",
    value: "+EUR 12,400",
    note: "discounts are negotiated before margin leaks",
  },
  {
    tone: "negative",
    label: "Bad approvals avoided",
    value: "-3",
    note: "high-risk deals stay in review instead of auto-approval",
  },
  {
    tone: "positive",
    label: "Approval speed",
    value: "+18%",
    note: "clean deals move faster through approval",
  },
  {
    tone: "neutral",
    label: "Human reviews kept",
    value: "2",
    note: "low-confidence deals still require owner control",
  },
];

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

  if (simulated.action === "approve") {
    return {
      change: `Changed: ${baseline.action} -> approve`,
      reason: "Reason: margin and confidence support approval",
    };
  }

  if (simulated.action === "negotiate") {
    return {
      change: `Changed: ${baseline.action} -> negotiate`,
      reason: "Reason: deal value is real, but terms need margin protection",
    };
  }

  if (simulated.action === "review") {
    return {
      change: `Changed: ${baseline.action} -> review`,
      reason: "Reason: middle path wins",
    };
  }

  if (simulated.action === "reject") {
    return {
      change: `Changed: ${baseline.action} -> reject`,
      reason: "Reason: weak margin and low deal quality dominate",
    };
  }

  return {
    change: `Changed: ${baseline.action} -> ${simulated.action}`,
    reason: "Reason: pricing trade-off profile shifted",
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
  const shiftLabel = `${changed.length} rule-level shift${changed.length === 1 ? "" : "s"}`;
  const simulatedExposure = comparison.reduce((sum, entry) => sum + entry.item.financialImpactEur, 0);
  return (
    <main>
      <div className="shell shell-tight">
        <section className="topbar topbar-tight">
          <div>
            <div className="eyebrow">NÓVUA Deal Room · Simulation Lab</div>
            <h1>What changes if margin matters more?</h1>
            <p className="subtle">Simulate approval strategy before changing pricing policy.</p>
          </div>
          <nav className="nav">
            <Link href="/dashboard">Deal Room</Link>
            <Link className="active" href="/simulation">Simulation</Link>
          </nav>
        </section>

        <section className="hero-strip">
          <div className="hero-card hero-primary">
            <div className="metric-label">Scenario</div>
            <div className="hero-value">Margin-first</div>
            <div className="metric-note">Protect margin while keeping high-confidence deals moving.</div>
          </div>
          <div className="hero-card hero-secondary">
            <div className="metric-label">Simulated impact</div>
            <div className="hero-value semantic-impact">+EUR 12,400</div>
            <div className="metric-note">from EUR {simulatedExposure.toLocaleString()} in deal value under approval pressure · {shiftLabel}</div>
          </div>
        </section>

        <section className="simulation-focus-layout refined-sim">
          <section className="panel simulation-main-panel">
            <div className="panel-title">
              <h2>Approval Shifts</h2>
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
                        <div className="delta-meta">score {simulatedScore.total.toFixed(2)} · EUR {item.financialImpactEur.toLocaleString()} deal value</div>
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
              <div className="panel-title"><h2>Business Impact</h2></div>
              <div className="stack compact-stack">
                {businessImpact.map((metric) => (
                  <div className={`queue-card impact-card ${metric.tone}`} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <div className="queue-meta">{metric.note}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
