import type { Team, WorkItem } from "@/engine/deal-room";

export type HumanAction = "approve" | "negotiate" | "route";

function auditTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function applyHumanAction(item: WorkItem, action: HumanAction): WorkItem {
  const time = auditTime();
  const auditTrail = [...item.auditTrail];

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
  if (action === "approve") return "Approval recorded. Deal removed from the live queue.";
  if (action === "negotiate") return "Deal returned to sales with updated negotiation status.";
  return `Deal routed to ${owner} and marked in review.`;
}
