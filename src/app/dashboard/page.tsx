import { Suspense } from "react";
import { DashboardView } from "./dashboard-view";

function DashboardFallback() {
  return (
    <main className="dr-page">
      <article className="dr-decision-card">
        <p className="dr-kicker">Loading workspace</p>
        <p className="dr-decision-note">Syncing live deal queue…</p>
      </article>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardView />
    </Suspense>
  );
}
