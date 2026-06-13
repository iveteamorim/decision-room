import { items, simulateDealPortfolio } from "@/engine/deal-room";
import { DrNav } from "@/components/dr-nav";
import { formatEur } from "@/lib/decision-ui";
import { commandFor } from "@/lib/decision-ui";

export default function SimulationPage() {
  const simulation = simulateDealPortfolio(items);
  const shiftLabel = `${simulation.changedCount} rule-level shift${simulation.changedCount === 1 ? "" : "s"}`;

  return (
    <main className="dr-page">
      <DrNav active="simulation" />

      <section className="dr-hero">
        <div>
          <p className="dr-kicker">Simulation lab</p>
          <h1>What changes if margin matters more?</h1>
          <p>
            Simulate approval strategy before changing pricing policy. Compare baseline
            recommendations against a margin-first weight profile across the full deal portfolio.
          </p>
          <div className="dr-flow">
            <span>Baseline</span>
            <span>Re-weight</span>
            <span>Compare</span>
            <span>Impact</span>
          </div>
        </div>
        <div className="dr-metrics">
          <div>
            <span>Scenario</span>
            <strong>{simulation.scenario.name}</strong>
          </div>
          <div>
            <span>Portfolio value</span>
            <strong>EUR {formatEur(simulation.totalValueUnderReview)}</strong>
          </div>
          <div>
            <span>Approval shifts</span>
            <strong>{simulation.changedCount}</strong>
          </div>
          <div>
            <span>Primary impact</span>
            <strong>{simulation.impact[0].value}</strong>
          </div>
        </div>
      </section>

      <section className="dr-critical-strip">
        <div>
          <p>Simulated scenario</p>
          <h2>{simulation.scenario.name}</h2>
          <span>
            {simulation.scenario.description} · {shiftLabel} across EUR {formatEur(simulation.totalValueUnderReview)} in deal value under approval pressure.
          </span>
        </div>
      </section>

      <section className="dr-workspace">
        <div className="dr-workspace-main">
          <div className="dr-list-panel">
            <div className="dr-panel-head">
              <div>
                <p>Approval shifts</p>
                <h2>Baseline vs simulated recommendations</h2>
              </div>
              <span>{simulation.comparisons.length} deals compared</span>
            </div>

            <div className="dr-sim-list">
              {simulation.comparisons.map(({ item, baseline, simulated, change }) => (
                <div className={`dr-sim-row ${change ? "changed" : ""}`} key={item.id}>
                  <div className="dr-sim-head">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="dr-sim-meta">
                        Score {simulated.scoreBreakdown.total.toFixed(2)} · EUR {formatEur(item.financialImpactEur)} deal value
                      </p>
                    </div>
                    <em className={`dr-badge ${simulated.action}`}>{simulated.action}</em>
                  </div>

                  <div className="dr-sim-compare">
                    <div>
                      <span>Baseline</span>
                      <strong>{commandFor(baseline.action)}</strong>
                    </div>
                    <div>
                      <span>Simulated</span>
                      <strong>{commandFor(simulated.action)}</strong>
                    </div>
                  </div>

                  {change ? (
                    <div className="dr-sim-change">
                      <strong>{change.summary}</strong>
                      <span>{change.reason}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="dr-decision-panel">
          <div className="dr-panel-subhead">
            <p>Scenario weights</p>
            <span>Margin-first profile</span>
          </div>

          <div className="dr-sim-list">
            {Object.entries(simulation.scenario.weights).map(([key, value]) => (
              <div className="dr-weight-row" key={key}>
                <div className="dr-weight-meta">
                  <strong>{key}</strong>
                  <span>{value.toFixed(2)}</span>
                </div>
                <div className="dr-score">
                  <span style={{ width: `${value * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="dr-panel-subhead" style={{ marginTop: 16 }}>
            <p>Business impact</p>
            <span>{shiftLabel}</span>
          </div>

          <div className="dr-sim-list">
            {simulation.impact.map((metric) => (
              <div className={`dr-impact-row ${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.note}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
