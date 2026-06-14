"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { decideItem } from "@/engine/deal-room";
import { formatCountdown, isSlaBreached } from "@/engine/deal-room/urgency";
import { DrNav } from "@/components/dr-nav";
import { useDealRoom } from "@/components/deal-room-provider";
import {
  actionFeedback,
  getHumanActionOptions,
  type HumanAction,
  type HumanActionVariant,
} from "@/lib/deal-actions";
import {
  commandFor,
  formatEur,
  reasonFor,
  stateLabel,
} from "@/lib/decision-ui";

function actionButtonClass(variant: HumanActionVariant) {
  if (variant === "primary") return "primary";
  if (variant === "warn") return "warn";
  return undefined;
}

export function DecisionBrief({ id }: { id: string }) {
  const router = useRouter();
  const { getItem, runAction, ready } = useDealRoom();
  const item = getItem(id);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState<HumanAction | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setFeedback(null);
    setPending(null);
  }, [id, item?.status, item?.owner, item?.approvalState]);

  if (!ready) {
    return (
      <main className="dr-page">
        <DrNav />
        <section className="dr-hero dr-hero-compact">
          <h1>Loading decision brief…</h1>
        </section>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="dr-page">
        <DrNav />
        <section className="dr-hero dr-hero-compact">
          <h1>Decision not found</h1>
        </section>
      </main>
    );
  }

  const result = decideItem(item);
  const reason = result.policyResult?.reason ?? reasonFor(result);
  const displayAction = item.status === "resolved" ? "approve" : result.action;
  const resolved = item.status === "resolved";
  const actionOptions = getHumanActionOptions(item);
  const recentEvents = [...item.auditTrail].slice(-4).reverse();
  const breached = isSlaBreached(item, now) || Boolean(item.slaBreached);

  async function handleAction(action: HumanAction) {
    setPending(action);
    try {
      await runAction(id, action);
      const updated = getItem(id);
      setFeedback(actionFeedback(action, updated?.owner ?? item!.owner));
      if (action === "approve") {
        router.push("/dashboard");
      }
    } catch {
      setFeedback("Action failed. Retry from the workspace.");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="dr-page">
      <DrNav />

      <p className="dr-back-link">
        <Link href="/dashboard">Back to workspace</Link>
      </p>

      <section className="dr-detail-hero dr-detail-hero-compact">
        <h1>{item.title}</h1>
      </section>

      <section className="dr-operational-grid dr-operational-grid-compact">
        <div>
          <span>State</span>
          <strong>{stateLabel(item.approvalState)}</strong>
        </div>
        <div>
          <span>Owner</span>
          <strong>{item.owner}</strong>
        </div>
        <div>
          <span>Deadline</span>
          <strong className={breached ? "dr-meta-breach" : undefined}>
            {formatCountdown(item.deadlineAt, now)}
          </strong>
        </div>
        <div className="dr-ops-highlight">
          <span>Action</span>
          <strong className={`dr-detail-action-badge ${displayAction}`}>{commandFor(displayAction)}</strong>
          <em>EUR {formatEur(item.financialImpactEur)}</em>
        </div>
      </section>

      <section className="dr-detail-brief">
        <p className="dr-detail-reason">{reason}</p>

        {feedback ? <p className="dr-action-feedback">{feedback}</p> : null}

        {resolved ? (
          <div className="dr-resolution-banner">
            <div>
              <span>Resolved</span>
              <strong>Approval recorded and removed from the live queue.</strong>
            </div>
            <Link href="/dashboard">Return to workspace</Link>
          </div>
        ) : null}

        <div className="dr-stakeholder-card dr-stakeholder-card-compact">
          <div className="dr-panel-head dr-panel-head-minimal">
            <h2>Stakeholders</h2>
          </div>
          {item.stakeholders.map((stakeholder) => (
            <div className="dr-stakeholder-row" key={stakeholder.team}>
              <strong>{stakeholder.team}</strong>
              <span className={`dr-badge ${stakeholder.position}`}>{stakeholder.position}</span>
            </div>
          ))}
        </div>

        {!resolved && actionOptions.length > 0 ? (
          <div className="dr-detail-actions dr-detail-actions-compact">
            <p className="dr-action-prompt">Choose next step for this deal</p>
            {actionOptions.map((option) => (
              <button
                key={option.action}
                className={actionButtonClass(option.variant)}
                type="button"
                disabled={pending !== null}
                onClick={() => handleAction(option.action)}
              >
                {pending === option.action ? "Recording…" : option.label}
              </button>
            ))}
            <a className="dr-export-link" href={`/api/audit/${item.id}`} download={`${item.id}-audit.json`}>
              Export audit packet
            </a>
          </div>
        ) : null}

        {!resolved && actionOptions.length === 0 ? (
          <div className="dr-detail-actions dr-detail-actions-compact">
            <p className="dr-action-prompt">No further actions available for this deal state.</p>
            <a className="dr-export-link" href={`/api/audit/${item.id}`} download={`${item.id}-audit.json`}>
              Export audit packet
            </a>
          </div>
        ) : null}

        <div className="dr-stakeholder-card dr-stakeholder-card-compact dr-audit-surface">
          <div className="dr-panel-head dr-panel-head-minimal">
            <h2>Recent activity</h2>
          </div>
          <div className="dr-audit-list-compact">
            {recentEvents.map((event) => (
              <div className="dr-audit-list-row" key={`${event.time}-${event.actor}-${event.event}`}>
                <span>{event.time}</span>
                <strong>{event.actor}</strong>
                <p>{event.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
