"use client";

import Link from "next/link";
import { useState } from "react";
import { decideItem } from "@/engine/deal-room";
import { DrNav } from "@/components/dr-nav";
import { useDealRoom } from "@/components/deal-room-provider";
import { actionFeedback, type HumanAction } from "@/lib/deal-actions";
import {
  commandFor,
  formatEur,
  reasonFor,
  stateLabel,
} from "@/lib/decision-ui";

export function DecisionBrief({ id }: { id: string }) {
  const { getItem, runAction } = useDealRoom();
  const item = getItem(id);
  const [feedback, setFeedback] = useState<string | null>(null);

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
  const owner = item.owner;
  const recentEvents = [...item.auditTrail].slice(-4).reverse();

  function handleAction(action: HumanAction) {
    runAction(id, action);
    setFeedback(actionFeedback(action, owner));
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
          <strong>{item.slaHours}h</strong>
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

        <div className="dr-detail-actions dr-detail-actions-compact">
          <button className="primary" type="button" disabled={resolved} onClick={() => handleAction("approve")}>
            Approve and close
          </button>
          <button type="button" disabled={resolved} onClick={() => handleAction("negotiate")}>
            Negotiate
          </button>
          <button className="warn" type="button" disabled={resolved} onClick={() => handleAction("route")}>
            Route to {owner}
          </button>
        </div>

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


