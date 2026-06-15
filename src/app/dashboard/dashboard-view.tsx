"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { decideItem } from "@/engine/deal-room";
import { computePressureStats, computeRankScore, formatCountdown, isSlaBreached } from "@/engine/deal-room/urgency";
import { DrNav } from "@/components/dr-nav";
import { useDealRoom } from "@/components/deal-room-provider";
import { useViewerRole } from "@/components/viewer-role-provider";
import { countLiveAuditEntries } from "@/lib/queue-ranking";
import {
  buildPolicyChecks,
  commandFor,
  dealContext,
  formatEur,
  pct,
  policyCheckLabel,
  reasonFor,
} from "@/lib/decision-ui";
import { filterDealsForRole, roleWorkspaceNote } from "@/lib/viewer-role";

export function DashboardView() {
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
  const [showAllDeals, setShowAllDeals] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { items, resetItems, ready, loadError } = useDealRoom();
  const { role } = useViewerRole();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const roleItems = useMemo(() => filterDealsForRole(items, role), [items, role]);

  const rolePressure = useMemo(() => computePressureStats(roleItems, now), [roleItems, now]);

  const decisions = useMemo(
    () =>
      roleItems
        .map((item) => ({ item, result: decideItem(item) }))
        .filter((entry) => entry.item.status !== "resolved")
        .sort(
          (a, b) =>
            computeRankScore(b.item, b.result.scoreBreakdown.total, now) -
            computeRankScore(a.item, a.result.scoreBreakdown.total, now),
        ),
    [roleItems, now],
  );

  const top = decisions[0];
  const visibleDecisions = showAllDeals ? decisions : decisions.slice(0, 3);
  const hiddenCount = decisions.length - 3;
  const auditEntryCount = useMemo(() => countLiveAuditEntries(roleItems), [roleItems]);
  const recentEvents = useMemo(
    () =>
      roleItems
        .filter((entry) => entry.status !== "resolved")
        .flatMap((entry) => entry.auditTrail.map((event) => ({ ...event, dealId: entry.id })))
        .slice(-4),
    [roleItems],
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
          <p className="dr-decision-note">Syncing live deal queue...</p>
        </article>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="dr-page">
        <DrNav active="dashboard" />
        <article className="dr-decision-card">
          <p className="dr-kicker">Workspace unavailable</p>
          <h2 className="review">Connection required</h2>
          <p className="dr-decision-note">{loadError}</p>
        </article>
      </main>
    );
  }

  if (!top) {
    return (
      <main className="dr-page">
        <DrNav active="dashboard" />
        <p className="dr-role-note">{roleWorkspaceNote(role)}</p>
        <article className="dr-decision-card">
          <p className="dr-kicker">Queue clear</p>
          <h2 className="approve">ALL CLEAR</h2>
          <p className="dr-decision-note">
            {role === "Finance"
              ? "No open decisions requiring human action."
              : `No decisions in the ${role} queue right now. Switch to Finance for the full workspace.`}
          </p>
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

      <p className="dr-role-note">{roleWorkspaceNote(role)}</p>

      {rolePressure.liveCount > 0 ? (
        <section className="dr-pressure-strip" aria-label="Operational pressure">
          <span>EUR {formatEur(rolePressure.eurAtRisk)} at risk</span>
          <span>{rolePressure.breaches} SLA breach{rolePressure.breaches === 1 ? "" : "es"}</span>
          <span>{rolePressure.needsAction} need action</span>
        </section>
      ) : null}

      <article className="dr-decision-card">
        <p className="dr-kicker">Priority decision</p>
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
        <Link className="dr-decision-cta" href={`/decisions/${top.item.id}`}>Review decision</Link>
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
                <span>{check.label} | {check.detail}</span>
                <em className={`dr-badge ${check.status === "pass" ? "approve" : "review"}`}>
                  {policyCheckLabel(check.status)}
                </em>
              </div>
            ))}
          </div>
        </article>

        <article className="dr-side-card dr-trail-card">
          <div className="dr-panel-head dr-panel-head-minimal dr-trail-head">
            <div>
              <p className="dr-kicker">Decision trail</p>
              <h2>{auditEntryCount} audit entries</h2>
            </div>
            <a
              className="dr-export-link dr-export-link-inline"
              href={`/api/audit/${top.item.id}`}
              download={`${top.item.id}-audit.json`}
            >
              Export audit packet
            </a>
          </div>
          {recentEvents.map((event) => (
            <div className="dr-activity-row" key={`${event.dealId}-${event.time}-${event.actor}-${event.event}`}>
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
