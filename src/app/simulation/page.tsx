import Link from "next/link";
import { items, simulateDealPortfolio } from "@/engine/deal-room";

export default function SimulationPage() {
  const simulation = simulateDealPortfolio(items);
  const shiftLabel = `${simulation.changedCount} rule-level shift${simulation.changedCount === 1 ? "" : "s"}`;

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
            <div className="hero-value">{simulation.scenario.name}</div>
            <div className="metric-note">{simulation.scenario.description}</div>
          </div>
          <div className="hero-card hero-secondary">
            <div className="metric-label">Simulated impact</div>
            <div className="hero-value semantic-impact">{simulation.impact[0].value}</div>
            <div className="metric-note">from EUR {simulation.totalValueUnderReview.toLocaleString()} in deal value under approval pressure · {shiftLabel}</div>
          </div>
        </section>

        <section className="simulation-focus-layout refined-sim">
          <section className="panel simulation-main-panel">
            <div className="panel-title">
              <h2>Approval Shifts</h2>
              <span className="chip">baseline vs simulated</span>
            </div>
            <div className="delta-list">
              {simulation.comparisons.map(({ item, baseline, simulated, change }) => {
                return (
                  <div className="delta-row" key={item.id}>
                    <div className="delta-head">
                      <div>
                        <strong>{item.title}</strong>
                        <div className="delta-meta">score {simulated.scoreBreakdown.total.toFixed(2)} · EUR {item.financialImpactEur.toLocaleString()} deal value</div>
                      </div>
                      <span className={`badge badge-${simulated.action}`}>{simulated.action}</span>
                    </div>
                    <div className="delta-grid">
                      <div className="delta-card"><div className="kicker">baseline</div><strong>{baseline.action}</strong></div>
                      <div className="delta-card"><div className="kicker">simulated</div><strong>{simulated.action}</strong></div>
                    </div>
                    {change ? (
                      <div className="conflict-banner compact-explain">
                        <strong>Changed: {change.summary}</strong>
                        <span>{change.reason}</span>
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
                {Object.entries(simulation.scenario.weights).map(([key, value]) => (
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
                {simulation.impact.map((metric) => (
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
