import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="dr-login-pro-page">
      <section className="dr-login-pro-shell">
        <div className="dr-login-pro-copy">
          <Link href="/" className="dr-pro-brand" aria-label="NOVUA Decision Room home">
            <span>NOVUA</span>
            <strong>Decision Room</strong>
          </Link>
          <span className="dr-pro-kicker">Workspace access</span>
          <h1>Enter the approval workspace.</h1>
          <p>
            Use the demo workspace to inspect the ranked queue, recommendation brief, simulations,
            and decision trail.
          </p>
          <div className="dr-login-pro-points">
            <span>Ranked queue</span>
            <span>Policy checks</span>
            <span>Audit replay</span>
          </div>
        </div>

        <div className="dr-login-pro-card" aria-label="Decision Room login">
          <div className="dr-login-pro-head">
            <span>Secure demo</span>
            <strong>Protected workspace</strong>
          </div>
          <form>
            <label>
              Work email
              <input type="email" name="email" placeholder="name@company.com" autoComplete="email" />
            </label>
            <label>
              Password
              <input type="password" name="password" placeholder="Enter password" autoComplete="current-password" />
            </label>
            <Link href="/dashboard" className="dr-login-pro-submit">Continue to workspace</Link>
          </form>
          <p>Demo credentials may be requested by the browser before the protected workspace opens.</p>
          <Link href="/" className="dr-login-pro-back">Back to landing</Link>
        </div>
      </section>
    </main>
  );
}
