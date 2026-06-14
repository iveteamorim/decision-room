"use client";

import { useMemo, useState } from "react";
import { items, simulateDealPortfolio } from "@/engine/deal-room";
import { DrNav } from "@/components/dr-nav";
import { commandFor, formatEur } from "@/lib/decision-ui";

export default function SimulationPage() {
  const [showAllDeals, setShowAllDeals] = useState(false);

  const simulation = useMemo(() => simulateDealPortfolio(items), []);
  const changedDeals = simulation.comparisons.filter((entry) => entry.change);
  const unchangedCount = simulation.comparisons.length - changedDeals.length;
  const visibleComparisons = showAllDeals ? simulation.comparisons : changedDeals;

  return (
    <main className="dr-page">
      <DrNav active="simulation" />

      <section className="dr-hero dr-hero-compact">
        <h1>Margin-first scenario</h1>
        <div className="dr-metrics dr-metrics-compact">
          <div>
            <span>Shifts</span>
            <strong>{simulation.changedCount}</strong>
          </div>
          <div>
            <span>Margin protected</span>
            <strong>{simulation.impact[0].value}</strong>
          </div>
        </div>
      </section>

      <div className="dr-sim-stack">
        <div className="dr-list-panel">
          <div className="dr-panel-head dr-panel-head-minimal">
            <h2>Weights</h2>
            <span>{simulation.scenario.name}</span>
          </div>
          <div className="dr-sim-list dr-sim-weights-inline">
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
        </div>

        <div className="dr-list-panel">
          <div className="dr-panel-head dr-panel-head-minimal">
            <h2>{showAllDeals ? "All deals" : "Deals that shift"}</h2>
            <span>{simulation.comparisons.length} deals</span>
          </div>

          {!showAllDeals && unchangedCount > 0 ? (
            <p className="dr-sim-summary">{unchangedCount} unchanged</p>
          ) : null}

          <div className="dr-sim-list">
            {visibleComparisons.map(({ item, baseline, simulated, change }) => (
              <div className={`dr-sim-row ${change ? "changed" : "dr-sim-row-quiet"}`} key={item.id}>
                <div className="dr-sim-head">
                  <div>
                    <strong>{item.title}</strong>
                    <p className="dr-sim-meta">EUR {formatEur(item.financialImpactEur)}</p>
                  </div>
                  <em className={`dr-badge ${simulated.action}`}>{simulated.action}</em>
                </div>

                {change ? (
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
                ) : (
                  <p className="dr-sim-unchanged">No shift</p>
                )}
              </div>
            ))}
          </div>

          {simulation.comparisons.length > changedDeals.length ? (
            <button
              type="button"
              className="dr-queue-toggle"
              onClick={() => setShowAllDeals((open) => !open)}
              aria-expanded={showAllDeals}
            >
              {showAllDeals
                ? "Shifts only"
                : `Show all ${simulation.comparisons.length}`}
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
