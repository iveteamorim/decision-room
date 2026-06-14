"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { decideItem } from "@/engine/deal-room";
import { computeRankScore, formatCountdown, isSlaBreached } from "@/engine/deal-room/urgency";
import { DrNav } from "@/components/dr-nav";
import { useDealRoom } from "@/components/deal-room-provider";
import {
  buildPolicyChecks,
  commandFor,
  dealContext,
  formatEur,
  pct,
  policyCheckLabel,
  reasonFor,
} from "@/lib/decision-ui";

export function DashboardView() {
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
  const [showAllDeals, setShowAllDeals] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { items, pressure, resetItems, ready, loadError } = useDealRoom();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const decisions = useMemo(
    () =>
      items
        .map((item) => ({ item, result: decideItem(item) }))
        .filter((entry) => entry.item.status !== "resolved")
        .sort(
          (a, b) =>
            computeRankScore(b.item, b.result.scoreBreakdown.total, now) -
            computeRankScore(a.item, a.result.scoreBreakdown.total, now),
        ),
    [items, now],
  );

  const top = decisions[0];
  const visibleDecisions = showAllDeals ? decisions : decisions.slice(0, 3);
  const hiddenCount = decisions.length - 3;
  const recentEvents = useMemo(
    () =>
      items
        .filter((entry) => entry.status !== "resolved")
        .flatMap((entry) => entry.auditTrail.map((event) => ({ ...event, dealId: entry.id })))
        .slice(-4),
    [items],
  );

  function caseClasses(index: number, decisionRisk: (typeof decisions)[number]["item"]["decisionRisk"], breached: boolean) {
    const classes = ["dr-case", "dr-case-balanced"];
    if (index === 0) classes.push("selected", "critical");
    else if (index === 1) classes.push("tone-blue");
    else if (index === 2) classes.push("tone-yellow");
    if (decisionRisk === "high") classes.push("risk-high");
    if (breached) classes.push("sla-breached");
    return classes.join(" ");
  }

  if (!ready) {
    return (
      <main className="dr-page">
        <DrNav active="dashboard" />
        <article className="dr-decision-card">
          <p className="dr-kicker">Loading workspace</p>
          <p className="dr-decision-note">Syncing live deal queue…</p>
        </article>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="dr-page">
        <DrNav active="dashboard" />
        <article className="dr-decision-card">
          <p className="dr-kicker">Store unavailable</p>
          <h2 className="review">CONNECTION REQUIRED</h2>
          <p className="dr-decision-note">{loadError}</p>
        </article>
      </main>
    );
  }

  if (!top) {
    return (
      <main className="dr-page">
        <DrNav active="dashboard" />
        <article className="dr-decision-card">
          <p className="dr-kicker">Workspace clear</p>
          <h2 className="approve">ALL CLEAR</h2>
          <p className="dr-decision-note">No deals waiting for human action.</p>
          {demoMode ? (
            <button type="button" className="dr-queue-toggle" onClick={() => resetItems()}>
              Reset demo deals
            </button>
          ) : null}
        </article>
      </main>
    );
  }

  const policyChecks = buildPolicyChecks(top.item, top.result);

  return (
    <main className="dr-page">
      <DrNav active="dashboard" />

      {pressure && pressure.liveCount > 0 ? (
        <section className="dr-pressure-strip" aria-label="Operational pressure">
          <span>EUR {formatEur(pressure.eurAtRisk)} at risk</span>
          <span>{pressure.breaches} SLA breach{pressure.breaches === 1 ? "" : "es"}</span>
          <span>{pressure.needsAction} need action</span>
        </section>
      ) : null}

      <article className="dr-decision-card">
        <p className="dr-kicker">Recommended action</p>
        <h2 className={top.result.action}>{commandFor(top.result.action).toUpperCase()}</h2>
        <p className="dr-decision-title">{top.item.title}</p>
        <div className="dr-decision-value">EUR {formatEur(top.item.financialImpactEur)}</div>

        <div className="dr-decision-metrics">
          <div><small>Margin</small><strong>{pct(top.item.marginScore)}</strong></div>
          <div><small>Risk</small><strong>{pct(top.item.riskScore)}</strong></div>
          <div><small>Confidence</small><strong>{pct(top.item.confidence)}</strong></div>
          <div><small>Deadline</small><strong>{formatCountdown(top.item.deadlineAt, now)}</strong></div>
        </div>

        <p className="dr-decision-note">{reasonFor(top.result)}</p>
        <Link className="dr-decision-cta" href={`/decisions/${top.item.id}`}>Open decision brief</Link>
      </article>

      <article className="dr-list-panel dr-list-panel-balanced dr-senior-queue">
        <div className="dr-panel-head dr-panel-head-minimal">
          <div>
            <p>Live queue</p>
            <h2>Ranked decisions</h2>
          </div>
          <span>{decisions.length} live</span>
        </div>

        <div className="dr-case-list">
          {visibleDecisions.map(({ item, result }, index) => {
            const breached = isSlaBreached(item, now) || Boolean(item.slaBreached);
            return (
              <Link
                className={caseClasses(index, item.decisionRisk, breached)}
                href={`/decisions/${item.id}`}
                key={item.id}
              >
                <span className="dr-rank">{index + 1}</span>
                <div className="dr-case-body">
                  <div className="dr-case-title">
                    <strong>{item.title}</strong>
                    <em className={`dr-badge ${result.action}`}>{result.action}</em>
                  </div>
                  <p>{dealContext[item.id] ?? reasonFor(result)}</p>
                  <div className="dr-case-meta">
                    <span>{item.status.replace(/_/g, " ")}</span>
                    <span>{item.owner}</span>
                    <span>{item.blockers.length} blocker{item.blockers.length === 1 ? "" : "s"}</span>
                    <span className={breached ? "dr-meta-breach" : undefined}>
                      {formatCountdown(item.deadlineAt, now)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {hiddenCount > 0 ? (
          <button
            type="button"
            className="dr-queue-toggle"
            onClick={() => setShowAllDeals((open) => !open)}
            aria-expanded={showAllDeals}
          >
            {showAllDeals
              ? "Show top 3 only"
              : `Show ${hiddenCount} more deal${hiddenCount === 1 ? "" : "s"}`}
          </button>
        ) : null}
      </article>

      <section className="dr-senior-sections">
        <article className="dr-side-card dr-analysis-card">
          <p className="dr-kicker">Policy checks</p>
          <div className="dr-check-list">
            {policyChecks.map((check) => (
              <div key={check.label} className="dr-check-row">
                <span>{check.label} · {check.detail}</span>
                <em className={`dr-badge ${check.status === "pass" ? "approve" : "review"}`}>
                  {policyCheckLabel(check.status)}
                </em>
              </div>
            ))}
          </div>
        </article>

        <article className="dr-side-card dr-activity-card">
          <p className="dr-kicker">Recent activity</p>
          {recentEvents.map((event) => (
            <div className="dr-activity-row" key={`${event.time}-${event.actor}-${event.event}`}>
              <div className="dr-activity-time">{event.time}</div>
              <div>
                <strong>{event.actor}</strong>
                <span>{event.event}</span>
              </div>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
