import { decideItem } from "@/engine/deal-room";
import type { AuditEvent, DecisionEvent, Team, WorkItem } from "@/engine/deal-room";

export type HumanAction = "approve" | "negotiate" | "route";

export type HumanActionVariant = "primary" | "default" | "warn";

export interface HumanActionOption {
  action: HumanAction;
  label: string;
  variant: HumanActionVariant;
}

function auditTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function isoNow() {
  return new Date().toISOString();
}

function humanEventId(dealId: string, action: HumanAction) {
  return `${dealId}:human:${action}:${Date.now()}`;
}

export function getHumanActionOptions(item: WorkItem): HumanActionOption[] {
  if (item.status === "resolved") return [];

  const { action: recommended } = decideItem(item);

  if (item.status === "pending" && item.owner === "Sales") {
    return [{ action: "approve", label: "Approve and close", variant: "primary" }];
  }

  if (item.status === "in_review") {
    const options: HumanActionOption[] = [];
    if (recommended === "negotiate" || recommended === "reject") {
      options.push({ action: "negotiate", label: "Negotiate", variant: "default" });
    }
    options.push({ action: "approve", label: "Approve and close", variant: "primary" });
    return options;
  }

  switch (recommended) {
    case "approve":
      return [{ action: "approve", label: "Approve and close", variant: "primary" }];
    case "negotiate":
      return [
        { action: "negotiate", label: "Negotiate", variant: "primary" },
        { action: "approve", label: "Approve and close", variant: "default" },
      ];
    case "reject":
      return [{ action: "negotiate", label: "Negotiate", variant: "primary" }];
    case "review":
    default:
      return [
        { action: "route", label: `Route to ${item.owner}`, variant: "warn" },
        { action: "approve", label: "Approve and close", variant: "primary" },
        { action: "negotiate", label: "Negotiate", variant: "default" },
      ];
  }
}

export function getValidHumanActions(item: WorkItem): HumanAction[] {
  return getHumanActionOptions(item).map((option) => option.action);
}

export function isValidHumanAction(item: WorkItem, action: HumanAction) {
  return getValidHumanActions(item).includes(action);
}

export function buildHumanLedgerEvent(
  item: WorkItem,
  action: HumanAction,
  nextOwner: Team,
): DecisionEvent {
  const messages: Record<HumanAction, string> = {
    approve: "Human approval recorded. Quote cleared for send.",
    negotiate: "Terms returned to sales for margin protection.",
    route: `Routed to ${nextOwner} for final human checkpoint.`,
  };

  return {
    id: humanEventId(item.id, action),
    type: "decision_replayed",
    dealId: item.id,
    occurredAt: isoNow(),
    actor: action === "negotiate" ? "Sales" : item.owner,
    owner: nextOwner,
    severity: action === "approve" ? "info" : "warning",
    action: action === "route" ? "review" : action,
    confidence: item.confidence,
    reason: messages[action],
    policyIds: [],
    checkpointIds: [],
    metadata: {
      humanAction: action,
      previousStatus: item.status,
      previousOwner: item.owner,
    },
  };
}

export function applyHumanAction(item: WorkItem, action: HumanAction): WorkItem {
  const time = auditTime();
  const auditTrail: AuditEvent[] = [...item.auditTrail];

  if (action === "approve") {
    auditTrail.push({
      time,
      actor: item.owner,
      event: "Human approval recorded. Quote cleared for send.",
      tone: "success",
    });
    return {
      ...item,
      status: "resolved",
      approvalState: "ready_to_send",
      policyBlock: false,
      blockers: [],
      auditTrail,
    };
  }

  if (action === "negotiate") {
    auditTrail.push({
      time,
      actor: "Sales",
      event: "Terms returned to sales for margin protection.",
      tone: "warning",
    });
    return {
      ...item,
      status: "pending",
      owner: "Sales",
      approvalState: "awaiting_approval",
      auditTrail,
    };
  }

  auditTrail.push({
    time,
    actor: "System",
    event: `Routed to ${item.owner} for final human checkpoint.`,
    tone: "neutral",
  });
  return {
    ...item,
    status: "in_review",
    approvalState: "awaiting_approval",
    auditTrail,
  };
}

export function actionFeedback(action: HumanAction, owner: Team) {
  if (action === "approve") return "Decision recorded and removed from the active queue.";
  if (action === "negotiate") return "Deal returned to sales with updated negotiation status.";
  return `Deal routed to ${owner} and marked in review.`;
}

export function buildHumanAuditExport(item: WorkItem, action?: HumanAction) {
  const decision = decideItem(item);
  const humanEvents =
    action && item.status !== "resolved"
      ? [buildHumanLedgerEvent(item, action, item.owner)]
      : [];

  return {
    dealId: item.id,
    title: item.title,
    exportedAt: isoNow(),
    ledger: decision.ledger,
    humanEvents,
    auditTrail: item.auditTrail,
  };
}
