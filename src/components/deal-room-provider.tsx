"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PressureStats, WorkItem } from "@/engine/deal-room";
import type { HumanAction } from "@/lib/deal-actions";

type DealRoomContextValue = {
  items: WorkItem[];
  pressure: PressureStats | null;
  ready: boolean;
  loadError: string | null;
  notice: string | null;
  dismissNotice: () => void;
  getItem: (id: string) => WorkItem | undefined;
  runAction: (id: string, action: HumanAction) => Promise<void>;
  resetItems: () => Promise<void>;
  refresh: () => Promise<void>;
};

const DealRoomContext = createContext<DealRoomContextValue | null>(null);

const emptyPressure: PressureStats = {
  eurAtRisk: 0,
  breaches: 0,
  needsAction: 0,
  liveCount: 0,
};

async function fetchDeals() {
  const response = await fetch("/api/deals", { cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to load deals.");
  }
  return response.json() as Promise<{ items: WorkItem[]; pressure: PressureStats }>;
}

interface TickResponse {
  newEvents?: string[];
  priorityChanged?: boolean;
  topDealTitle?: string | null;
  scenarioMessage?: string | null;
}

function buildTickNotice(tick: TickResponse) {
  if (tick.priorityChanged && tick.topDealTitle) {
    return `Priority changed — ${tick.topDealTitle} is now #1.`;
  }
  if (tick.scenarioMessage) return tick.scenarioMessage;
  if (tick.newEvents?.length) return "Live queue updated — new operational signal received.";
  return null;
}

export function DealRoomProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [pressure, setPressure] = useState<PressureStats | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const dismissNotice = useCallback(() => {
    setNotice(null);
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
  }, []);

  const showNotice = useCallback(
    (message: string | null) => {
      if (!message) return;
      setNotice(message);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => setNotice(null), 7000);
    },
    [],
  );

  const refresh = useCallback(async () => {
    const snapshot = await fetchDeals();
    setItems(snapshot.items);
    setPressure(snapshot.pressure);
    setLoadError(null);
  }, []);

  const runTick = useCallback(
    async (silent = false) => {
      const response = await fetch("/api/deals/tick", { method: "POST" });
      if (!response.ok) return;
      const tick = (await response.json()) as TickResponse;
      await refresh();
      if (!silent) {
        showNotice(buildTickNotice(tick));
      }
    },
    [refresh, showNotice],
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        await fetch("/api/deals/tick", { method: "POST" });
        if (!active) return;
        await refresh();
      } catch (error) {
        if (active) {
          setPressure(emptyPressure);
          setLoadError(error instanceof Error ? error.message : "Failed to connect to deal store.");
        }
      } finally {
        if (active) setReady(true);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!ready) return;
    const interval = window.setInterval(() => {
      runTick(false).catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [ready, runTick]);

  useEffect(() => {
    if (!ready) return;
    const interval = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [ready, refresh]);

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const runAction = useCallback(
    async (id: string, action: HumanAction) => {
      const response = await fetch(`/api/deals/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("Action failed.");
      await refresh();
      showNotice("Decision recorded — workspace queue updated.");
    },
    [refresh, showNotice],
  );

  const resetItems = useCallback(async () => {
    const response = await fetch("/api/deals/reset?demo=1", { method: "POST" });
    if (!response.ok) throw new Error("Reset failed.");
    await refresh();
    showNotice("Demo workspace reset — Acme 18% scenario restored.");
  }, [refresh, showNotice]);

  const value = useMemo(
    () => ({
      items,
      pressure,
      ready,
      loadError,
      notice,
      dismissNotice,
      getItem: (id: string) => items.find((item) => item.id === id),
      runAction,
      resetItems,
      refresh,
    }),
    [items, pressure, ready, loadError, notice, dismissNotice, runAction, resetItems, refresh],
  );

  if (!ready) {
    return (
      <DealRoomContext.Provider value={value}>
        <div className="dr-loading-shell">{children}</div>
      </DealRoomContext.Provider>
    );
  }

  return <DealRoomContext.Provider value={value}>{children}</DealRoomContext.Provider>;
}

export function useDealRoom() {
  const context = useContext(DealRoomContext);
  if (!context) throw new Error("useDealRoom must be used within DealRoomProvider");
  return context;
}
