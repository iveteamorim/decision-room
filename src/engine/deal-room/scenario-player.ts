import type { AuditEvent, WorkItem } from "./types";

export interface ScenarioBeat {
  id: string;
  dealId: string;
  afterMinutes: number;
  audit: AuditEvent;
  urgencyBoost?: number;
  escalate?: boolean;
}

export const SCENARIO_BEATS: ScenarioBeat[] = [
  {
    id: "deal-1:buyer-push",
    dealId: "deal-1",
    afterMinutes: 2,
    audit: {
      time: "Live",
      actor: "System",
      event: "Buyer confirmed same-day signature if approved before noon.",
      tone: "warning",
    },
    urgencyBoost: 0.08,
  },
  {
    id: "deal-2:forecast",
    dealId: "deal-2",
    afterMinutes: 4,
    audit: {
      time: "Live",
      actor: "Sales",
      event: "Forecast updated: logo win would unlock two expansion accounts.",
      tone: "neutral",
    },
    urgencyBoost: 0.05,
  },
  {
    id: "deal-1:cfo-loop",
    dealId: "deal-1",
    afterMinutes: 8,
    audit: {
      time: "Live",
      actor: "System",
      event: "CFO looped in after SLA window dropped below 2 hours.",
      tone: "danger",
    },
    urgencyBoost: 0.12,
    escalate: true,
  },
];

export interface ScenarioState {
  sessionStartedAt: string;
  appliedBeatIds: string[];
}

export interface ScenarioTickResult {
  items: WorkItem[];
  appliedBeatIds: string[];
  newEvents: string[];
}

function auditClock(now: Date) {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function applyBeat(item: WorkItem, beat: ScenarioBeat, now: Date): WorkItem {
  const audit: AuditEvent = {
    ...beat.audit,
    time: auditClock(now),
  };
  const urgencyBoost = Math.max(item.urgencyBoost ?? 0, beat.urgencyBoost ?? 0);

  return {
    ...item,
    urgencyBoost,
    urgencyScore: Math.min(1, item.urgencyScore + (beat.urgencyBoost ?? 0) * 0.5),
    auditTrail: [...item.auditTrail, audit],
    ...(beat.escalate
      ? {
          approvalState: "awaiting_approval" as const,
          blockers: item.blockers.includes("Executive escalation after SLA compression.")
            ? item.blockers
            : [...item.blockers, "Executive escalation after SLA compression."],
        }
      : {}),
  };
}

function applySlaBreach(item: WorkItem, now: Date): WorkItem {
  if (item.status === "resolved" || item.slaBreached) return item;
  if (new Date(item.deadlineAt).getTime() > now.getTime()) return item;

  const audit: AuditEvent = {
    time: auditClock(now),
    actor: "System",
    event: "SLA breached. Deal escalated in the live queue.",
    tone: "danger",
  };

  return {
    ...item,
    slaBreached: true,
    urgencyBoost: Math.max(item.urgencyBoost ?? 0, 0.15),
    auditTrail: [...item.auditTrail, audit],
  };
}

export function runScenarioTick(
  items: WorkItem[],
  state: ScenarioState,
  now = new Date(),
): ScenarioTickResult {
  const sessionStart = new Date(state.sessionStartedAt).getTime();
  const elapsedMinutes = (now.getTime() - sessionStart) / 60_000;
  const applied = new Set(state.appliedBeatIds);
  const newEvents: string[] = [];

  let nextItems = items.map((item) => applySlaBreach(item, now));

  for (const beat of SCENARIO_BEATS) {
    if (applied.has(beat.id) || beat.afterMinutes > elapsedMinutes) continue;

    nextItems = nextItems.map((item) => {
      if (item.id !== beat.dealId || item.status === "resolved") return item;
      newEvents.push(beat.id);
      return applyBeat(item, beat, now);
    });
    applied.add(beat.id);
  }

  return {
    items: nextItems,
    appliedBeatIds: Array.from(applied),
    newEvents,
  };
}
