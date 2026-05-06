import Link from "next/link";
import { decideItem, items } from "@/engine/deal-room";
import type { ApprovalState, WorkItem } from "@/engine/deal-room";

const context: Record<string, string> = {
  "deal-1": "Discount is inside margin guardrails, but approval is time-sensitive.",
  "deal-2": "High-value contract request pushes margin below the approval threshold.",
  "deal-3": "Custom liability terms add legal risk before signature.",
  "deal-4": "Renewal uplift is clean, profitable, and low-risk.",
  "deal-5": "Expansion forecast has weak confidence and needs human review.",
  "deal-7": "Pilot economics do not justify approval under current terms.",
};

function reasonFor(result: ReturnType<typeof decideItem>) {
  if (result.policyResult) return result.policyResult.reason;
  if (result.requiresHumanReview) return "Confidence is low, so the operator stays in control.";
  if (result.action === "approve") return "Margin, risk, urgency, and confidence support approval.";
  if (result.action === "negotiate") return "The deal has value, but terms need margin protection.";
  if (result.action === "review") return "The approval requires human judgment before commitment.";
  return "The value-to-margin trade-off is not strong enough to approve.";
}

function commandFor(result: ReturnType<typeof decideItem>) {
  if (result.action === "approve") return "Approve";
  if (result.action === "negotiate") return "Negotiate";
  if (result.action === "review") return "Review";
  return "Reject";
}

function stateLabel(state: ApprovalState) {
  if (state === "awaiting_approval") return "Awaiting approval";
  if (state === "policy_conflict") return "Policy conflict";
  if (state === "legal_review") return "Legal review";
  if (state === "ready_to_send") return "Ready to send";
  return "Terms rejected";
}

function hasStakeholderConflict(item: WorkItem) {
  return new Set(item.stakeholders.map((stakeholder) => stakeholder.position)).size > 1;
}

export default function DashboardPage() {
  const decisions = items
    .map((item) => ({ item, result: decideItem(item) }))
    .filter((entry) => entry.item.status !== "resolved")
    .sort((a, b) => b.result.scoreBreakdown.total - a.result.scoreBreakdown.total);

  const top = decisions[0];
  const valueAtRisk = decisions.reduce((sum, entry) => sum + entry.item.financialImpactEur, 0);
  const reviewCount = decisions.filter((entry) => entry.result.requiresHumanReview).length;
  const conflictCount = decisions.filter((entry) => hasStakeholderConflict(entry.item)).length;

  return (
    <main className="dr-page">
      <header className="dr-nav">
        <div>
          <span className="dr-brand">NÓVUA DEAL ROOM</span>
          <span className="dr-product">AI deal approval support</span>
        </div>
        <nav>
          <Link className="active" href="/dashboard">Workspace</Link>
          <Link href="/simulation">Simulation</Link>
        </nav>
      </header>

      <section className="dr-hero">
        <div>
          <p className="dr-kicker">Pricing + discounts + approval governance</p>
          <h1>Approve better deals. Protect margin.</h1>
          <p>
            NÓVUA Deal Room prepares every deal with margin, risk, urgency,
            confidence, and clear reasoning before approval.
          </p>
        </div>
        <div className="dr-metrics">
          <div>
            <span>Pipeline under review</span>
            <strong>EUR {valueAtRisk.toLocaleString()}</strong>
          </div>
          <div>
            <span>Needs approval</span>
            <strong>{reviewCount}</strong>
          </div>
          <div>
            <span>Team conflicts</span>
            <strong>{conflictCount}</strong>
          </div>
        </div>
      </section>

      <section className="dr-critical-strip">
        <div>
          <p>Critical approval now</p>
          <h2>Enterprise discount needs approval now.</h2>
          <span>{reasonFor(top.result)} Owner: {top.item.owner}. EUR {top.item.financialImpactEur.toLocaleString()} exposed with a {top.item.slaHours}h deadline.</span>
        </div>
        <Link href={`/decisions/${top.item.id}`}>Open approval plan</Link>
      </section>

      <section className="dr-workspace">
        <div className="dr-list-panel">
          <div className="dr-panel-head">
            <div>
              <p>Deal queue</p>
              <h2>Deals ranked by the engine</h2>
            </div>
            <span>{decisions.length} active deals</span>
          </div>

          <div className="dr-case-list">
            {decisions.slice(0, 5).map(({ item, result }, index) => (
              <Link
                className={`dr-case ${index === 0 ? "selected critical" : ""} ${item.decisionRisk === "high" ? "risk-high" : ""}`}
                href={`/decisions/${item.id}`}
                key={item.id}
              >
                <span className="dr-rank">{index + 1}</span>
                <div className="dr-case-body">
                  <div className="dr-case-title">
                    <strong>{item.title}</strong>
                    <em className={`dr-badge ${result.action}`}>{result.action}</em>
                  </div>
                  <p>{context[item.id] ?? item.title}</p>
                  <div className="dr-state-row">
                    <span>{stateLabel(item.approvalState)}</span>
                    <span>Owner: {item.owner}</span>
                    <span>{item.blockers.length} blockers</span>
                    {hasStakeholderConflict(item) ? <strong>Team conflict</strong> : null}
                  </div>
                  <div className="dr-signals">
                    <span>EUR {item.financialImpactEur.toLocaleString()}</span>
                    <span>{Math.round(item.marginScore * 100)}% margin</span>
                    <span>{Math.round(item.riskScore * 100)}% risk</span>
                    <span>{item.slaHours}h deadline</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="dr-decision-panel">
          <p className="dr-kicker">Engine output</p>
          <h2>{top.item.title}</h2>
          <div className={`dr-action ${top.result.action}`}>{commandFor(top.result)}</div>
          <span className={`dr-badge ${top.result.action}`}>{top.result.action}</span>
          <p>{reasonFor(top.result)}</p>
          <div className="dr-score">
            <span style={{ width: `${Math.round(top.result.scoreBreakdown.total * 100)}%` }} />
          </div>
          <div className="dr-panel-warning">
            <strong>Approval pressure</strong>
            <span>{top.result.policyResult ? top.result.policyResult.triggeredBy : "Score threshold"}</span>
          </div>
          <div className="dr-stakeholder-list">
            <p>Stakeholder positions</p>
            {top.item.stakeholders.map((stakeholder) => (
              <div key={stakeholder.team}>
                <strong>{stakeholder.team}</strong>
                <span className={`dr-badge ${stakeholder.position}`}>{stakeholder.position}</span>
              </div>
            ))}
          </div>
          <div className="dr-breakdown">
            <div><span>Deal value</span><strong>EUR {top.item.valueEur.toLocaleString()}</strong></div>
            <div><span>Margin</span><strong>{Math.round(top.item.marginScore * 100)}%</strong></div>
            <div><span>Risk</span><strong>{Math.round(top.item.riskScore * 100)}%</strong></div>
          </div>
          <Link className="dr-primary" href={`/decisions/${top.item.id}`}>Open approval plan</Link>
        </aside>
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
          <strong>Human override</strong>
          <p>Sensitive approvals stay reviewable instead of pretending full autonomy is safe.</p>
        </div>
      </section>
    </main>
  );
}
