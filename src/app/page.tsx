import Image from "next/image";
import Link from "next/link";

const approvalCases = [
  {
    eyebrow: "High-value approvals",
    title: "Large discounts and enterprise deals",
    text: "Prioritize commercial requests where margin, customer value, and urgency need explicit sign-off.",
  },
  {
    eyebrow: "Risk exceptions",
    title: "Restricted markets and policy edge cases",
    text: "Route sensitive deals through visible controls before teams commit to the wrong action.",
  },
  {
    eyebrow: "Strategic pricing",
    title: "Partner exceptions and negotiation limits",
    text: "Give Sales, Finance, and Legal one place to inspect the recommendation and approve the path forward.",
  },
];

export default function HomePage() {
  return (
    <main className="dr-landing-pro">
      <header className="dr-pro-nav" aria-label="Decision Room navigation">
        <Link href="/" className="dr-pro-brand" aria-label="NOVUA Decision Room home">
          <span>NOVUA</span>
          <strong>Decision Room</strong>
        </Link>
        <nav>
          <a href="#product">Product</a>
          <a href="#governance">Use cases</a>
          <Link href="/login">Login</Link>
          <Link href="/dashboard" className="dr-pro-nav-cta">Open demo</Link>
        </nav>
      </header>

      <section className="dr-pro-hero">
        <div className="dr-pro-copy">
          <span className="dr-pro-kicker">Commercial decision platform</span>
          <h1>AI-assisted approvals with policy and human oversight.</h1>
          <p>
            Decision Room helps revenue, finance, and legal teams decide high-value commercial requests
            with ranked queues, explainable signals, and accountable sign-off.
          </p>
          <div className="dr-pro-actions">
            <Link href="/login" className="dr-pro-primary">Enter workspace</Link>
            <Link href="/dashboard" className="dr-pro-secondary">View product demo</Link>
          </div>
        </div>

        <div id="product" className="dr-product-frame" aria-label="Decision Room workspace preview">
          <div className="dr-product-frame-top">
            <span />
            <span />
            <span />
            <strong>Approval queue</strong>
          </div>
          <Image
            src="/decision-workspace.png"
            alt="Decision Room workspace showing a ranked approval queue, recommendation, and controls"
            width={1440}
            height={920}
            priority
            className="dr-product-shot"
          />
        </div>
      </section>

      <section id="governance" className="dr-pro-section dr-use-case-section">
        <div className="dr-pro-section-head">
          <span className="dr-pro-kicker">Built for consequential requests</span>
          <h2>When a deal needs judgment, Decision Room creates the room.</h2>
          <p>
            Keep the decision surface narrow: what changed, why it matters, who owns the approval,
            and what action is recommended.
          </p>
        </div>
        <div className="dr-pro-cards">
          {approvalCases.map((item) => (
            <article key={item.eyebrow}>
              <span>{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dr-pro-control-panel">
        <div>
          <span className="dr-pro-kicker">Governance layer</span>
          <h2>AI prepares the brief. People own the decision.</h2>
        </div>
        <div className="dr-control-list">
          <p><strong>Inspectable scoring</strong><span>Signals, weights, and recommendation logic stay visible before action.</span></p>
          <p><strong>Approval checkpoints</strong><span>Finance, Legal, and Sales owners remain attached to the workflow.</span></p>
          <p><strong>Decision replay</strong><span>Every final action can be reviewed with the context that produced it.</span></p>
        </div>
      </section>

      <section className="dr-pro-final">
        <span className="dr-pro-kicker">Demo ready</span>
        <h2>Review the queue like an operator, not a visitor.</h2>
        <Link href="/login" className="dr-pro-primary">Access Decision Room</Link>
      </section>
    </main>
  );
}
