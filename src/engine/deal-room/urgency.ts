import type { WorkItem } from "./types";

export interface PressureStats {
  eurAtRisk: number;
  breaches: number;
  needsAction: number;
  liveCount: number;
}

export function computeEffectiveUrgency(item: WorkItem, now = Date.now()): number {
  const deadlineMs = new Date(item.deadlineAt).getTime();
  const totalMs = item.slaHours * 3_600_000;
  const msLeft = deadlineMs - now;
  const elapsedRatio = totalMs > 0 ? Math.max(0, Math.min(1, 1 - msLeft / totalMs)) : 1;
  const pressureBoost = elapsedRatio * 0.35;
  const breachBoost = msLeft <= 0 ? 0.25 : 0;
  const scenarioBoost = item.urgencyBoost ?? 0;
  return Math.min(1, item.urgencyScore + pressureBoost + breachBoost + scenarioBoost);
}

export function isSlaBreached(item: WorkItem, now = Date.now()): boolean {
  return new Date(item.deadlineAt).getTime() <= now;
}

export function formatCountdown(deadlineAt: string, now = Date.now()): string {
  const ms = new Date(deadlineAt).getTime() - now;
  if (ms <= 0) return "Breached";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function computeRankScore(item: WorkItem, engineScore: number, now = Date.now()): number {
  return engineScore + computeEffectiveUrgency(item, now) * 0.25;
}

export function computePressureStats(items: WorkItem[], now = Date.now()): PressureStats {
  const live = items.filter((item) => item.status !== "resolved");
  const breached = live.filter((item) => isSlaBreached(item, now) || item.slaBreached);
  const needsAction = live.filter((item) => item.blockers.length > 0 || isSlaBreached(item, now));

  return {
    eurAtRisk: breached.reduce((sum, item) => sum + item.financialImpactEur, 0),
    breaches: breached.length,
    needsAction: needsAction.length,
    liveCount: live.length,
  };
}
