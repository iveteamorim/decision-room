"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { decideItem, items } from "@/engine/deal-room";
import { DrNav } from "@/components/dr-nav";
import {
  buildPolicyChecks,
  commandFor,
  dealContext,
  formatEur,
  hasStakeholderConflict,
  headlineFor,
  policyCheckLabel,
  reasonFor,
  stateLabel,
} from "@/lib/decision-ui";

export default function DashboardPage() {
  const [showAllDeals, setShowAllDeals] = useState(false);

  const decisions = useMemo(
    () =>
      items
        .map((item) => ({ item, result: decideItem(item) }))
        .filter((entry) => entry.item.status !== "resolved")
        .sort((a, b) => b.result.scoreBreakdown.total - a.result.scoreBreakdown.total),
    [],
  );

  const top = decisions[0];
  const valueAtRisk = decisions.reduce((sum, entry) => sum + entry.item.financialImpactEur, 0);
  const reviewCount = decisions.filter((entry) => entry.result.requiresHumanReview).length;
  const topWhy = top.result.policyResult?.reason ?? reasonFor(top.result);
  const policyChecks = buildPolicyChecks(top.item, top.result);
  const visibleDecisions = showAllDeals ? decisions : decisions.slice(0, 3);

  function caseClasses(index: number, decisionRisk: (typeof decisions)[number]["item"]["decisionRisk"]) {
    const classes = ["dr-case"];
    if (index === 0) classes.push("selected", "critical");
    else if (index === 1) classes.push("tone-blue");
    else if (index === 2) classes.push("tone-yellow");
    if (decisionRisk === "high") classes.push("risk-high");
    return classes.join(" ");
  }

  return (
    <main className="dr-page">
      <DrNav active="dashboard" />

      <section className="dr-hero">
        <div>
          <p className="dr-kicker">AI-assisted approval workspace</p>
          <h1>See the decision before the deal becomes a risk.</h1>
          <p>
            AI-assisted approval workspace for pricing, discounts, and policy-sensitive deals.
          </p>
        </div>
        <div className="dr-metrics">
          <div>
            <span>Under review</span>
            <strong>EUR {formatEur(valueAtRisk)}</strong>
          </div>
          <div>
            <span>Deals needing action</span>
            <strong>{reviewCount}</strong>
          </div>
        </div>
      </section>

      <section className="dr-critical-strip">
        <div>
          <p>Decision under pressure</p>
          <h2>{top.item.title}</h2>
          <span>
            {topWhy} Owner: {top.item.owner}. EUR {formatEur(top.item.financialImpactEur)} exposed with a {top.item.slaHours}h deadline.
          </span>
        </div>
        <Link href={`/decisions/${top.item.id}`}>Open approval plan</Link>
      </section>

      <div className="dr-dashboard-shell">
        <div className="dr-dashboard-main">
          <div className="dr-list-panel">
            <div className="dr-panel-head">
              <div>
                <p>Deal queue</p>
                <h2>Decisions ranked by the engine</h2>
              </div>
              <span>{decisions.length} active deals</span>
            </div>

            <div className="dr-case-list">
              {visibleDecisions.map(({ item, result }, index) => (
                <Link
                  className={caseClasses(index, item.decisionRisk)}
                  href={`/decisions/${item.id}`}
                  key={item.id}
                >
                  <span className="dr-rank">{index + 1}</span>
                  <div className="dr-case-body">
                    <div className="dr-case-title">
                      <strong>{item.title}</strong>
                      <em className={`dr-badge ${result.action}`}>{result.action}</em>
                    </div>
                    <p>{dealContext[item.id] ?? item.title}</p>
                    <div className="dr-state-row">
                      <span>{stateLabel(item.approvalState)}</span>
                      <span>Owner: {item.owner}</span>
                      <span>{item.blockers.length} blockers</span>
                      {hasStakeholderConflict(item) ? <strong>Team conflict</strong> : null}
                    </div>
                    <div className="dr-signals">
                      <span>EUR {formatEur(item.financialImpactEur)}</span>
                      <span>{Math.round(item.marginScore * 100)}% margin</span>
                      <span>{Math.round(item.riskScore * 100)}% risk</span>
                      <span>{item.slaHours}h deadline</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {decisions.length > 3 ? (
              <button
                type="button"
                className="dr-queue-toggle"
                onClick={() => setShowAllDeals((open) => !open)}
                aria-expanded={showAllDeals}
              >
                {showAllDeals
                  ? "Show top 3 only"
                  : `Show ${decisions.length - 3} more deal${decisions.length - 3 === 1 ? "" : "s"}`}
              </button>
            ) : null}
          </div>
        </div>

        <aside className="dr-decision-panel">
          <div className="dr-decision-summary">
            <p className="dr-kicker">Recommended action</p>
            <span className={`dr-badge ${top.result.action}`}>{top.result.action}</span>
            <h2>{commandFor(top.result.action)}</h2>
            <p className="dr-decision-headline">{headlineFor(top.result)}</p>
            <div className="dr-score">
              <span style={{ width: `${Math.round(top.result.scoreBreakdown.total * 100)}%` }} />
            </div>
            <div className="dr-breakdown">
              <div><span>Deal value</span><strong>EUR {formatEur(top.item.valueEur)}</strong></div>
              <div><span>Margin</span><strong>{Math.round(top.item.marginScore * 100)}%</strong></div>
              <div><span>Risk</span><strong>{Math.round(top.item.riskScore * 100)}%</strong></div>
              <div><span>Confidence</span><strong>{Math.round(top.item.confidence * 100)}%</strong></div>
            </div>
          </div>

          <div className="dr-panel-warning">
            <strong>Human checkpoint</strong>
            <span>{top.result.requiresHumanReview ? `${top.item.owner} approval required` : "No manual override required"}</span>
          </div>

          <div className="dr-policy-panel">
            <div className="dr-panel-subhead">
              <p>Policy checks</p>
              <span>{top.result.policyResult ? "Blocked path detected" : "Engine path is policy-safe"}</span>
            </div>
            <div className="dr-policy-checks">
              {policyChecks.map((check) => (
                <div className={`dr-policy-check ${check.status}`} key={check.label}>
                  <div>
                    <strong>{check.label}</strong>
                    <p>{check.detail}</p>
                  </div>
                  <span>{policyCheckLabel(check.status)}</span>
                </div>
              ))}
            </div>
          </div>

          <Link className="dr-primary" href={`/decisions/${top.item.id}`}>Open approval plan</Link>
        </aside>

        <section className="dr-dashboard-footer">
          <section className="dr-context-row">
          <div className="dr-context-stack">
            <div className="dr-explain-panel">
              <div className="dr-panel-subhead">
                <p>Why this decision</p>
                <span>{top.result.policyResult ? top.result.policyResult.triggeredBy : "Cross-functional conflict"}</span>
              </div>
              <ul>
                <li>{topWhy}</li>
                <li>{top.item.blockers.length ? `${top.item.blockers.length} blocker(s) remain active before commitment.` : "No open blocker is preventing execution."}</li>
                <li>{hasStakeholderConflict(top.item) ? "Stakeholders are not fully aligned, so the recommendation preserves human review." : "Stakeholders are mostly aligned on the current path."}</li>
              </ul>
            </div>

            <div className="dr-stakeholder-list dr-context-card">
              <p>Stakeholder positions</p>
              {top.item.stakeholders.map((stakeholder) => (
                <div key={stakeholder.team}>
                  <strong>{stakeholder.team}</strong>
                  <span className={`dr-badge ${stakeholder.position}`}>{stakeholder.position}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dr-audit-preview dr-context-card">
            <div className="dr-panel-subhead">
              <p>Audit trail</p>
              <span>Latest events</span>
            </div>
            {top.item.auditTrail.slice(-3).map((event) => (
              <div className={`dr-audit-mini ${event.tone}`} key={`${event.time}-${event.event}`}>
                <span>{event.time}</span>
                <strong>{event.actor}</strong>
                <p>{event.event}</p>
              </div>
            ))}
          </div>
          </section>

          <section className="dr-capabilities">
            <div>
              <span>01</span>
              <strong>Approval policies</strong>
              <p>Hard rules protect margin, legal exposure, and approval thresholds before scoring.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Weighted scoring</strong>
              <p>Deal value, margin, risk, urgency, and confidence are explicit and adjustable.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Explainability</strong>
              <p>Every recommendation exposes why a deal should be approved, negotiated, reviewed, or rejected.</p>
            </div>
            <div>
              <span>04</span>
              <strong>Human checkpoints</strong>
              <p>Sensitive approvals stay reviewable instead of pretending full autonomy is safe.</p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
