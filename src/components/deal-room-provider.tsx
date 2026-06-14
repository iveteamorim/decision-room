"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PressureStats, WorkItem } from "@/engine/deal-room";
import type { HumanAction } from "@/lib/deal-actions";

type DealRoomContextValue = {
  items: WorkItem[];
  pressure: PressureStats | null;
  ready: boolean;
  loadError: string | null;
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

export function DealRoomProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [pressure, setPressure] = useState<PressureStats | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const snapshot = await fetchDeals();
    setItems(snapshot.items);
    setPressure(snapshot.pressure);
    setLoadError(null);
  }, []);

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
    const interval = window.setInterval(async () => {
      try {
        await fetch("/api/deals/tick", { method: "POST" });
        await refresh();
      } catch {
        /* keep last known state */
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [ready, refresh]);

  useEffect(() => {
    if (!ready) return;
    const interval = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [ready, refresh]);

  const runAction = useCallback(
    async (id: string, action: HumanAction) => {
      const response = await fetch(`/api/deals/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("Action failed.");
      await refresh();
    },
    [refresh],
  );

  const resetItems = useCallback(async () => {
    const response = await fetch("/api/deals/reset?demo=1", { method: "POST" });
    if (!response.ok) throw new Error("Reset failed.");
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      items,
      pressure,
      ready,
      loadError,
      getItem: (id: string) => items.find((item) => item.id === id),
      runAction,
      resetItems,
      refresh,
    }),
    [items, pressure, ready, loadError, runAction, resetItems, refresh],
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
