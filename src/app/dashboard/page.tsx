import Link from "next/link";
import { items } from "@/lib/dataset";
import { decideItem } from "@/lib/decision-engine";

function dominantFactor(result: ReturnType<typeof decideItem>) {
  return Object.entries(result.scoreBreakdown)
    .filter(([key]) => key !== "total")
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];
}

function actionLabel(result: ReturnType<typeof decideItem>) {
  if (result.requiresHumanReview) return "Act now";
  if (result.action === "escalate" || result.action === "prioritize") return "Act now";
  if (result.action === "review") return "Review next";
  return "Blocked by policy";
}

function actionReason(item: (typeof items)[number], result: ReturnType<typeof decideItem>) {
  if (result.policyResult) return `${result.policyResult.action} triggered by ${result.policyResult.triggeredBy.toLowerCase()}`;
  if (result.requiresHumanReview) return "High risk · low confidence -> human review required.";
  if (result.action === "prioritize") return "Prioritize now because time pressure and business impact dominate.";
  if (result.action === "escalate") return "Escalate now because policy or risk threshold blocks normal routing.";
  return "Hold for later because risk or workload still outweighs immediate action.";
}

export default function DashboardPage() {
  const decisions = items.map((item) => ({ item, result: decideItem(item) }));
  const exposure = decisions.reduce((sum, entry) => sum + entry.item.financialImpactEur, 0);
  const reviewLocked = decisions.filter((entry) => entry.result.requiresHumanReview);
  const attentionNow = decisions
    .filter(
      (entry) =>
        entry.result.action === "prioritize" ||
        entry.result.action === "escalate" ||
        entry.result.requiresHumanReview,
    )
    .sort((a, b) => b.item.financialImpactEur - a.item.financialImpactEur)
    .slice(0, 5);

  return (
    <main>
      <div className="shell">
        <section className="topbar topbar-tight">
          <div>
            <div className="eyebrow">Decision Room</div>
            <h1>Mission Control</h1>
            <p className="subtle">High-stakes decisions across revenue, support, and risk.</p>
          </div>
          <nav className="nav">
            <Link className="active" href="/dashboard">Mission Control</Link>
            <Link href="/simulation">Simulation Lab</Link>
          </nav>
        </section>

        <section className="hero-strip">
          <div className="hero-card hero-primary">
            <div className="metric-label">Exposure at risk</div>
            <div className="hero-value semantic-impact">EUR {exposure.toLocaleString()}</div>
            <div className="metric-note">money currently sitting in unresolved decisions</div>
          </div>
          <div className="hero-card hero-secondary">
            <div className="metric-label">Needs human review</div>
            <div className="hero-value">{reviewLocked.length}</div>
            <div className="metric-note">items blocked by confidence conflict or high-risk policy path</div>
          </div>
        </section>

        <section className="focus-layout">
          <section className="panel attention-panel">
            <div className="panel-title">
              <h2>Attention Now</h2>
              <span className="chip">start with the highest exposure</span>
            </div>
            <div className="attention-list">
              {attentionNow.map(({ item, result }) => (
                <div className="attention-card" key={item.id}>
                  <div className="stream-head">
                    <div>
                      <strong>{item.title}</strong>
                      <div className="stream-meta">{actionLabel(result)} · {item.type} · {item.id} · SLA {item.slaHours}h</div>
                    </div>
                    <span className={`badge badge-${result.action}`}>{result.action}</span>
                  </div>
                  <div className="conflict-banner" style={{ marginBottom: 10 }}>
                    {actionReason(item, result)}
                  </div>
                  <div className="chip-row">
                    <span className="chip">{dominantFactor(result)} dominated</span>
                    <span className="chip">EUR {item.financialImpactEur.toLocaleString()} at risk</span>
                    <span className="chip">{item.complianceRisk} compliance risk</span>
                  </div>
                  {item.operationalBlock ? <div className="preview-banner">Operational block active</div> : null}
                  <div className="attention-actions">
                    <Link className="action-link" href={`/decisions/${item.id}`}>Open Decision Workspace</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="side-stack">
            <section className="panel compact-panel">
              <div className="panel-title">
                <h2>Decision Pressure</h2>
              </div>
              <div className="stack compact-stack">
                <div className="queue-card"><strong>Revenue pressure</strong><div className="mini-row"><span>financial exposure</span><span>EUR {exposure.toLocaleString()}</span></div></div>
                <div className="queue-card"><strong>Compliance pressure</strong><div className="mini-row"><span>high-risk items</span><span>{items.filter((item) => item.complianceRisk === "high").length}</span></div></div>
                <div className="queue-card"><strong>Blocked operations</strong><div className="mini-row"><span>operational blocks</span><span>{items.filter((item) => item.operationalBlock).length}</span></div></div>
              </div>
            </section>

            <section className="panel compact-panel">
              <div className="panel-title">
                <h2>Needs Human Review</h2>
              </div>
              <div className="stack compact-stack">
                {reviewLocked.map(({ item, result }) => (
                  <div className="queue-card" key={item.id}>
                    <strong>{item.title}</strong>
                    <div className="queue-meta">{actionReason(item, result)}</div>
                    <div className="chip-row">
                      <span className="lock-chip locked">review lock</span>
                      <span className="chip">EUR {item.financialImpactEur.toLocaleString()}</span>
                    </div>
                    <div className="attention-actions">
                      <Link className="action-link" href={`/decisions/${item.id}`}>Open Decision Workspace</Link>
                    </div>
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
