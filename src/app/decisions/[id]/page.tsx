import Link from "next/link";
import { items } from "@/lib/dataset";
import { decideItem } from "@/lib/decision-engine";
import type { ApprovalState, WorkItem } from "@/types/decision";

const context: Record<string, string> = {
  "deal-1": "Enterprise discount is within margin guardrails, but the approval window is short.",
  "deal-2": "The contract is high-value, but the requested discount puts margin below threshold.",
  "deal-3": "The deal can close, but custom liability terms require legal review before signature.",
  "deal-4": "Renewal uplift is profitable, low-risk, and supported by strong confidence.",
  "deal-5": "Expansion upside is real, but the forecast confidence is too weak for automatic approval.",
  "deal-7": "The pilot request has low value and weak margin, so approval is not justified.",
};

const paths: Record<string, string> = {
  "deal-1": "Approve if the discount stays at 18% and standard payment terms remain unchanged.",
  "deal-2": "Negotiate discount down or add term length before approval.",
  "deal-3": "Route to legal and approve only after liability exposure is capped.",
  "deal-4": "Approve renewal uplift with standard terms.",
  "deal-5": "Request review from sales leadership before committing expansion forecast.",
  "deal-7": "Reject current pilot terms or require a paid setup fee.",
};

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function stateLabel(state: ApprovalState) {
  if (state === "awaiting_approval") return "Awaiting approval";
  if (state === "policy_conflict") return "Policy conflict";
  if (state === "legal_review") return "Legal review";
  if (state === "ready_to_send") return "Ready to send";
  return "Terms rejected";
}

function stakeholderSummary(item: WorkItem) {
  const positions = Array.from(new Set(item.stakeholders.map((stakeholder) => stakeholder.position)));
  if (positions.length === 1) return "Teams are aligned on the recommended path.";
  return `${item.stakeholders.map((stakeholder) => `${stakeholder.team}: ${stakeholder.position}`).join(" · ")}`;
}

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return (
      <main className="dr-page">
        <header className="dr-nav">
          <div><span className="dr-brand">NÓVUA DEAL ROOM</span><span className="dr-product">AI deal approval support</span></div>
          <nav><Link href="/dashboard">Workspace</Link><Link href="/simulation">Simulation</Link></nav>
        </header>
        <section className="dr-hero">
          <div>
            <p className="dr-kicker">Deal Room</p>
            <h1>Deal not found.</h1>
            <p>This deal is not part of the demo dataset.</p>
          </div>
        </section>
      </main>
    );
  }

  const result = decideItem(item);
  const reason = result.policyResult?.reason ?? "This path is recommended after comparing deal value, margin, risk, urgency, and confidence.";
  const trace = [
    {
      title: "Revenue threshold",
      body: `EUR ${item.financialImpactEur.toLocaleString()} enters the approval workflow with ${item.slaHours}h left.`,
    },
    {
      title: "Policy precedence",
      body: result.policyResult
        ? `${result.policyResult.triggeredBy}: ${result.policyResult.reason}`
        : "No hard policy blocks the deal, so weighted scoring controls the recommendation.",
    },
    {
      title: "Stakeholder conflict",
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
      <header className="dr-nav">
        <div>
          <span className="dr-brand">NÓVUA DEAL ROOM</span>
          <span className="dr-product">AI deal approval support</span>
        </div>
        <nav>
          <Link href="/dashboard">Workspace</Link>
          <Link href="/simulation">Simulation</Link>
        </nav>
      </header>

      <section className="dr-detail-hero">
        <div>
          <p className="dr-kicker">Deal approval workspace</p>
          <h1>{item.title}</h1>
          <p>{context[item.id] ?? item.title}</p>
        </div>
        <div className="dr-detail-action">
          <span>Recommended approval path</span>
          <strong className={result.action}>{result.action}</strong>
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
          <p className="dr-kicker">Reasoning trace</p>
          <h2>{reason}</h2>
          <div className="dr-score">
            <span style={{ width: `${Math.round(result.scoreBreakdown.total * 100)}%` }} />
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
            <button className="primary" type="button">Approve deal</button>
            <button type="button">Negotiate terms</button>
            <button className="warn" type="button">Escalate to {item.owner}</button>
            <button type="button">Freeze terms</button>
          </div>
        </section>

        <aside className="dr-path-card">
          <p className="dr-kicker">Recommended path</p>
          <blockquote>{paths[item.id] ?? "Choose the action with the clearest margin-to-risk trade-off."}</blockquote>
          <span>Deal value: EUR {item.financialImpactEur.toLocaleString()}</span>
        </aside>
      </section>

      <section className="dr-governance-grid">
        <section className="dr-stakeholder-card">
          <p className="dr-kicker">Multi-actor approval</p>
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
          <p className="dr-kicker">Operational history</p>
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
        <div><span>Deal value</span><strong>EUR {item.valueEur.toLocaleString()}</strong></div>
        <div><span>Margin</span><strong>{pct(item.marginScore)}</strong></div>
        <div><span>Deal risk</span><strong>{pct(item.riskScore)}</strong></div>
        <div><span>Urgency</span><strong>{pct(item.urgencyScore)}</strong></div>
      </section>
    </main>
  );
}
