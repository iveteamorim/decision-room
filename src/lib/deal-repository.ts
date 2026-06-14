import { materializeSeedItems } from "@/engine/deal-room/fixtures";
import { SCENARIO_BEATS, runScenarioTick } from "@/engine/deal-room/scenario-player";
import type { AuditEvent, Team, WorkItem } from "@/engine/deal-room/types";
import { computePressureStats } from "@/engine/deal-room/urgency";
import { applyHumanAction, isValidHumanAction, type HumanAction } from "@/lib/deal-actions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const WORKSPACE_ID = "default";

interface DealRow {
  id: string;
  type: string;
  title: string;
  value_eur: number;
  risk_score: number;
  urgency_score: number;
  margin_score: number;
  confidence: number;
  sla_hours: number;
  deadline_at: string;
  sla_breached: boolean;
  urgency_boost: number;
  status: string;
  financial_impact_eur: number;
  decision_risk: string;
  policy_block: boolean;
  approval_state: string;
  owner: string;
  blockers: string[];
  stakeholders: WorkItem["stakeholders"];
}

interface DealEventRow {
  id?: string;
  deal_id: string;
  display_time: string;
  occurred_at: string;
  actor: string;
  message: string;
  tone: string;
  source: string;
  beat_id: string | null;
}

interface WorkspaceRow {
  session_started_at: string;
  applied_beat_ids: string[];
}

function workItemToRow(item: WorkItem): DealRow & { updated_at: string } {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    value_eur: item.valueEur,
    risk_score: item.riskScore,
    urgency_score: item.urgencyScore,
    margin_score: item.marginScore,
    confidence: item.confidence,
    sla_hours: item.slaHours,
    deadline_at: item.deadlineAt,
    sla_breached: item.slaBreached ?? false,
    urgency_boost: item.urgencyBoost ?? 0,
    status: item.status,
    financial_impact_eur: item.financialImpactEur,
    decision_risk: item.decisionRisk,
    policy_block: item.policyBlock,
    approval_state: item.approvalState,
    owner: item.owner,
    blockers: item.blockers,
    stakeholders: item.stakeholders,
    updated_at: new Date().toISOString(),
  };
}

function rowToWorkItem(row: DealRow, events: DealEventRow[]): WorkItem {
  const seenAuditKeys = new Set<string>();
  const dedupedEvents = events.filter((event) => {
    const key = `${event.source}:${event.beat_id ?? "none"}:${event.display_time}:${event.actor}:${event.message}`;
    if (seenAuditKeys.has(key)) return false;
    seenAuditKeys.add(key);
    return true;
  });

  return {
    id: row.id,
    type: row.type as WorkItem["type"],
    title: row.title,
    valueEur: Number(row.value_eur),
    riskScore: Number(row.risk_score),
    urgencyScore: Number(row.urgency_score),
    marginScore: Number(row.margin_score),
    confidence: Number(row.confidence),
    slaHours: Number(row.sla_hours),
    deadlineAt: row.deadline_at,
    slaBreached: row.sla_breached,
    urgencyBoost: Number(row.urgency_boost),
    status: row.status as WorkItem["status"],
    financialImpactEur: Number(row.financial_impact_eur),
    decisionRisk: row.decision_risk as WorkItem["decisionRisk"],
    policyBlock: row.policy_block,
    approvalState: row.approval_state as WorkItem["approvalState"],
    owner: row.owner as Team,
    blockers: row.blockers,
    stakeholders: row.stakeholders,
    auditTrail: dedupedEvents.map((event) => ({
      id: event.id ?? `${event.occurred_at}:${event.actor}:${event.message}`,
      time: event.display_time,
      actor: event.actor as AuditEvent["actor"],
      event: event.message,
      tone: event.tone as AuditEvent["tone"],
    })),
  };
}

function groupEventsByDeal(events: DealEventRow[]) {
  const grouped = new Map<string, DealEventRow[]>();
  for (const event of events) {
    const current = grouped.get(event.deal_id) ?? [];
    current.push(event);
    grouped.set(event.deal_id, current);
  }
  return grouped;
}

function auditToEventRow(
  dealId: string,
  audit: AuditEvent,
  occurredAt: string,
  source: string,
  beatId?: string,
): DealEventRow {
  return {
    deal_id: dealId,
    display_time: audit.time,
    occurred_at: occurredAt,
    actor: audit.actor,
    message: audit.event,
    tone: audit.tone,
    source,
    beat_id: beatId ?? null,
  };
}

async function insertEvents(rows: DealEventRow[]) {
  if (!rows.length) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("deal_events").insert(rows);
  if (error) throw error;
}

async function loadSnapshot() {
  const supabase = getSupabaseAdmin();

  const [{ data: deals, error: dealsError }, { data: events, error: eventsError }, { data: workspace, error: workspaceError }] =
    await Promise.all([
      supabase.from("deals").select("*").order("id"),
      supabase.from("deal_events").select("*").order("occurred_at"),
      supabase.from("workspace_state").select("session_started_at, applied_beat_ids").eq("id", WORKSPACE_ID).maybeSingle(),
    ]);

  if (dealsError) throw dealsError;
  if (eventsError) throw eventsError;
  if (workspaceError) throw workspaceError;

  const groupedEvents = groupEventsByDeal((events ?? []) as DealEventRow[]);
  const items = ((deals ?? []) as DealRow[]).map((row) =>
    rowToWorkItem(row, groupedEvents.get(row.id) ?? []),
  );

  const workspaceRow = workspace as WorkspaceRow | null;

  return {
    items,
    sessionStartedAt: workspaceRow?.session_started_at ?? new Date().toISOString(),
    appliedBeatIds: workspaceRow?.applied_beat_ids ?? [],
  };
}

export async function seedFromFixtures(now = Date.now()) {
  const supabase = getSupabaseAdmin();
  const items = materializeSeedItems(now);
  const sessionStartedAt = new Date(now).toISOString();

  await supabase.from("deals").delete().neq("id", "");

  const { error: workspaceError } = await supabase.from("workspace_state").upsert({
    id: WORKSPACE_ID,
    session_started_at: sessionStartedAt,
    applied_beat_ids: [],
    updated_at: sessionStartedAt,
  });
  if (workspaceError) throw workspaceError;

  const { error: dealsError } = await supabase.from("deals").insert(items.map(workItemToRow));
  if (dealsError) throw dealsError;

  const eventRows = items.flatMap((item, itemIndex) =>
    item.auditTrail.map((audit, auditIndex) =>
      auditToEventRow(
        item.id,
        audit,
        new Date(now - (items.length - itemIndex) * 60_000 - auditIndex * 1_000).toISOString(),
        "seed",
      ),
    ),
  );

  await insertEvents(eventRows);
}

export async function ensureSeeded() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  if ((count ?? 0) === 0) {
    await seedFromFixtures();
  }
}

export async function getDealStoreSnapshot() {
  await ensureSeeded();
  const snapshot = await loadSnapshot();
  return {
    items: snapshot.items,
    pressure: computePressureStats(snapshot.items),
    sessionStartedAt: snapshot.sessionStartedAt,
  };
}

export async function getDealById(id: string) {
  await ensureSeeded();
  const snapshot = await loadSnapshot();
  return snapshot.items.find((item) => item.id === id);
}

export async function applyDealAction(id: string, action: HumanAction) {
  await ensureSeeded();
  const snapshot = await loadSnapshot();
  const item = snapshot.items.find((entry) => entry.id === id);
  if (!item) return null;

  if (!isValidHumanAction(item, action)) {
    throw new Error(`Action "${action}" is not valid for the current deal state.`);
  }

  const previousLength = item.auditTrail.length;
  const updated = applyHumanAction(item, action);
  const supabase = getSupabaseAdmin();

  const { error: updateError } = await supabase
    .from("deals")
    .update(workItemToRow(updated))
    .eq("id", id);
  if (updateError) throw updateError;

  const newEvents = updated.auditTrail.slice(previousLength);
  const now = Date.now();
  await insertEvents(
    newEvents.map((audit, index) =>
      auditToEventRow(id, audit, new Date(now + index).toISOString(), "human"),
    ),
  );

  return updated;
}

function beatIdForEvent(dealId: string, message: string, appliedBeatIds: string[]) {
  return appliedBeatIds.find((beatId) => {
    const beat = SCENARIO_BEATS.find((entry) => entry.id === beatId);
    return beat?.dealId === dealId && beat.audit.event === message;
  });
}

export async function tickDealStore() {
  await ensureSeeded();
  const snapshot = await loadSnapshot();
  const tick = runScenarioTick(snapshot.items, {
    sessionStartedAt: snapshot.sessionStartedAt,
    appliedBeatIds: snapshot.appliedBeatIds,
  });

  const supabase = getSupabaseAdmin();
  const now = Date.now();
  let eventOffset = 0;

  for (const after of tick.items) {
    const before = snapshot.items.find((item) => item.id === after.id);
    if (!before) continue;

    const dealChanged = JSON.stringify(before) !== JSON.stringify(after);
    if (!dealChanged) continue;

    const { error: updateError } = await supabase
      .from("deals")
      .update(workItemToRow(after))
      .eq("id", after.id);
    if (updateError) throw updateError;

    const newAudit = after.auditTrail.slice(before.auditTrail.length);
    const eventRows = newAudit.map((audit) => {
      const source = audit.event.includes("SLA breached") ? "sla" : "scenario";
      const beatId = beatIdForEvent(after.id, audit.event, tick.newEvents);
      eventOffset += 1;
      return auditToEventRow(
        after.id,
        audit,
        new Date(now + eventOffset).toISOString(),
        source,
        beatId,
      );
    });

    await insertEvents(eventRows);
  }

  const { error: workspaceError } = await supabase
    .from("workspace_state")
    .update({
      applied_beat_ids: tick.appliedBeatIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", WORKSPACE_ID);
  if (workspaceError) throw workspaceError;

  return {
    items: tick.items,
    newEvents: tick.newEvents,
    pressure: computePressureStats(tick.items),
  };
}

export async function resetDealStore() {
  await seedFromFixtures();
  const snapshot = await loadSnapshot();
  return {
    items: snapshot.items,
    pressure: computePressureStats(snapshot.items),
  };
}

export async function getDealEvents(dealId: string) {
  await ensureSeeded();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("deal_events")
    .select("*")
    .eq("deal_id", dealId)
    .order("occurred_at");

  if (error) throw error;
  return (data ?? []) as DealEventRow[];
}
