import { decideItem } from "@/engine/deal-room";
import { computeRankScore } from "@/engine/deal-room/urgency";
import type { WorkItem } from "@/engine/deal-room";

export function getTopRankedDeal(items: WorkItem[], now = Date.now()) {
  const ranked = items
    .filter((item) => item.status !== "resolved")
    .map((item) => ({ item, result: decideItem(item) }))
    .sort(
      (a, b) =>
        computeRankScore(b.item, b.result.scoreBreakdown.total, now) -
        computeRankScore(a.item, a.result.scoreBreakdown.total, now),
    );

  const top = ranked[0];
  return top ? { id: top.item.id, title: top.item.title } : null;
}

export function countLiveAuditEntries(items: WorkItem[]) {
  return items
    .filter((item) => item.status !== "resolved")
    .reduce((sum, item) => sum + item.auditTrail.length, 0);
}
