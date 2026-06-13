import Link from "next/link";
import { decideItem, items } from "@/engine/deal-room";
import { DrNav } from "@/components/dr-nav";
import {
  buildPolicyChecks,
  commandFor,
  dealContext,
  formatEur,
  pct,
  policyCheckLabel,
  recommendedPaths,
  stakeholderSummary,
  stateLabel,
} from "@/lib/decision-ui";

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return (
      <main className="dr-page">
        <DrNav />
        <section className="dr-hero">
          <div>
            <p className="dr-kicker">Decision workspace</p>
            <h1>Decision not found.</h1>
            <p>This approval case is not part of the current demo dataset.</p>
          </div>
        </section>
      </main>
    );
  }

  const result = decideItem(item);
  const reason = result.policyResult?.reason ?? "This path is recommended after comparing deal value, margin, risk, urgency, and confidence.";
  const policyChecks = buildPolicyChecks(item, result);
  const trace = [
    {
      title: "Revenue threshold",
      body: `EUR ${formatEur(item.financialImpactEur)} enters the workflow with ${item.slaHours}h left to act.`,
    },
    {
      title: "Policy precedence",
      body: result.policyResult
        ? `${result.policyResult.triggeredBy}: ${result.policyResult.reason}`
        : "No hard policy blocks the deal, so weighted scoring controls the recommendation.",
    },
    {
      title: "Stakeholder alignment",
      body: stakeholderSummary(item),
    },
    {
      title: "Execution state",
      body: item.blockers.length
        ? `${item.owner} must clear: ${item.blockers.join(" ")}`
        : "No open blockers. The deal can move to approval or customer send-off.",
    },
  ];

  return (
    <main className="dr-page">
      <DrNav />

      <section className="dr-detail-hero">
        <div>
          <p className="dr-kicker">Approval workspace</p>
          <h1>{item.title}</h1>
          <p>{dealContext[item.id] ?? item.title}</p>
        </div>
        <div className="dr-detail-action">
          <span>Recommended action</span>
          <strong className={result.action}>{commandFor(result.action)}</strong>
        </div>
      </section>

      <section className="dr-operational-grid">
        <div>
          <span>Current state</span>
          <strong>{stateLabel(item.approvalState)}</strong>
        </div>
        <div>
          <span>Owner</span>
          <strong>{item.owner}</strong>
        </div>
        <div>
          <span>Open blockers</span>
          <strong>{item.blockers.length}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{pct(item.confidence)}</strong>
        </div>
      </section>

      <section className="dr-detail-grid">
        <section className="dr-reason-card">
          <div className="dr-panel-subhead">
            <p>Why this decision</p>
            <span>{result.policyResult ? result.policyResult.triggeredBy : "Weighted scoring path"}</span>
          </div>
          <h2>{reason}</h2>
          <div className="dr-score">
            <span style={{ width: `${Math.round(result.scoreBreakdown.total * 100)}%` }} />
          </div>

          <div className="dr-policy-checks dr-policy-checks-detail">
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

          <div className="dr-trace">
            {trace.map((step, index) => (
              <div key={step.title}>
                <span>{index + 1}</span>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            ))}
          </div>

          <div className="dr-detail-actions">
            <button className="primary" type="button">Approve decision</button>
            <button type="button">Negotiate terms</button>
            <button className="warn" type="button">Route to {item.owner}</button>
            <button type="button">Freeze terms</button>
          </div>
        </section>

        <aside className="dr-path-card">
          <p className="dr-kicker">Recommended path</p>
          <blockquote>{recommendedPaths[item.id] ?? "Choose the action with the clearest margin-to-risk trade-off."}</blockquote>
          <span>Deal value: EUR {formatEur(item.financialImpactEur)}</span>
          <div className="dr-breakdown">
            <div><span>Margin</span><strong>{pct(item.marginScore)}</strong></div>
            <div><span>Risk</span><strong>{pct(item.riskScore)}</strong></div>
            <div><span>Urgency</span><strong>{pct(item.urgencyScore)}</strong></div>
          </div>
        </aside>
      </section>

      <section className="dr-governance-grid">
        <section className="dr-stakeholder-card">
          <p className="dr-kicker">Stakeholder positions</p>
          {item.stakeholders.map((stakeholder) => (
            <div key={stakeholder.team}>
              <div>
                <strong>{stakeholder.team}</strong>
                <span className={`dr-badge ${stakeholder.position}`}>{stakeholder.position}</span>
              </div>
              <p>{stakeholder.note}</p>
            </div>
          ))}
        </section>

        <section className="dr-audit-card">
          <div className="dr-panel-subhead">
            <p>Audit trail</p>
            <span>Operational history</span>
          </div>
          {item.auditTrail.map((event) => (
            <div className={`dr-audit-row ${event.tone}`} key={`${event.time}-${event.event}`}>
              <span>{event.time}</span>
              <strong>{event.actor}</strong>
              <p>{event.event}</p>
            </div>
          ))}
        </section>
      </section>

      <section className="dr-signal-grid">
        <div><span>Deal value</span><strong>EUR {formatEur(item.valueEur)}</strong></div>
        <div><span>Margin</span><strong>{pct(item.marginScore)}</strong></div>
        <div><span>Deal risk</span><strong>{pct(item.riskScore)}</strong></div>
        <div><span>Urgency</span><strong>{pct(item.urgencyScore)}</strong></div>
      </section>
    </main>
  );
}
