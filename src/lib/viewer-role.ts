import type { Team, WorkItem } from "@/engine/deal-room";
import type { HumanActionOption } from "@/lib/deal-actions";
import { getHumanActionOptions } from "@/lib/deal-actions";

export type ViewerRole = Team;

export const VIEWER_ROLES: ViewerRole[] = ["Finance", "Sales", "Legal", "Policy"];

const STORAGE_KEY = "novua-viewer-role";

export function loadViewerRole(): ViewerRole {
  if (typeof window === "undefined") return "Finance";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && VIEWER_ROLES.includes(stored as ViewerRole)) {
    return stored as ViewerRole;
  }
  return "Finance";
}

export function saveViewerRole(role: ViewerRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, role);
}

function hasLegalSignal(item: WorkItem) {
  return (
    item.owner === "Legal" ||
    item.approvalState === "legal_review" ||
    item.stakeholders.some((entry) => entry.team === "Legal") ||
    item.blockers.some((blocker) => /legal|liability|clause|signature/i.test(blocker))
  );
}

function hasPolicySignal(item: WorkItem) {
  return (
    item.policyBlock ||
    item.approvalState === "policy_conflict" ||
    item.stakeholders.some((entry) => entry.team === "Policy") ||
    item.blockers.some((blocker) => /policy|margin|rule/i.test(blocker))
  );
}

export function isDealVisibleForRole(item: WorkItem, role: ViewerRole) {
  if (role === "Finance") return true;
  if (role === "Sales") return !hasLegalSignal(item) || item.owner === "Sales";
  if (role === "Legal") return hasLegalSignal(item);
  if (role === "Policy") return hasPolicySignal(item);
  return true;
}

export function filterDealsForRole(items: WorkItem[], role: ViewerRole) {
  return items.filter((item) => isDealVisibleForRole(item, role));
}

export function canActOnDeal(item: WorkItem, role: ViewerRole) {
  if (item.status === "resolved") return false;
  if (role === "Finance") return true;
  if (role === item.owner) return true;
  if (role === "Sales" && item.owner === "Sales") return true;
  if (role === "Legal" && item.owner === "Legal") return true;
  if (role === "Policy" && hasPolicySignal(item)) return true;
  return false;
}

export function getRoleActionOptions(item: WorkItem, role: ViewerRole): HumanActionOption[] {
  if (!canActOnDeal(item, role)) return [];
  return getHumanActionOptions(item);
}

export function roleWorkspaceNote(role: ViewerRole) {
  switch (role) {
    case "Finance":
      return "Finance view — full approval queue and policy context.";
    case "Sales":
      return "Sales view — legal review deals are routed out of this queue.";
    case "Legal":
      return "Legal view — contract and liability decisions only.";
    case "Policy":
      return "Policy view — margin conflicts and rule exceptions only.";
    default:
      return "";
  }
}
