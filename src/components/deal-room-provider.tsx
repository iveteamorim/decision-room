"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  computePressureStats,
  materializeSeedItems,
  type PressureStats,
  type WorkItem,
} from "@/engine/deal-room";
import { applyHumanAction, type HumanAction } from "@/lib/deal-actions";

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

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchDeals() {
  const response = await fetchWithTimeout("/api/deals", { cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to load deals.");
  }
  return response.json() as Promise<{ items: WorkItem[]; pressure: PressureStats }>;
}

function buildLocalDemoSnapshot() {
  const items = materializeSeedItems();
  return {
    items,
    pressure: computePressureStats(items),
  };
}

type TickResponse = {
  newEvents?: string[];
  priorityChanged?: boolean;
  topDealTitle?: string | null;
  scenarioMessage?: string | null;
};

function buildTickNotice(tick: TickResponse) {
  if (tick.priorityChanged && tick.topDealTitle) {
    return `Priority changed - ${tick.topDealTitle} is now #1.`;
  }
  if (tick.scenarioMessage) return tick.scenarioMessage;
  if (tick.newEvents?.length) return "Live queue updated - new operational signal received.";
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

  const showNotice = useCallback((message: string | null) => {
    if (!message) return;
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 7000);
  }, []);

  const useLocalDemo = useCallback(
    (message?: string) => {
      const snapshot = buildLocalDemoSnapshot();
      setItems(snapshot.items);
      setPressure(snapshot.pressure);
      setLoadError(null);
      if (message) showNotice(message);
    },
    [showNotice],
  );

  const refresh = useCallback(async () => {
    try {
      const snapshot = await fetchDeals();
      setItems(snapshot.items);
      setPressure(snapshot.pressure);
      setLoadError(null);
    } catch {
      useLocalDemo("Demo workspace loaded locally.");
    }
  }, [useLocalDemo]);

  const runTick = useCallback(
    async (silent = false) => {
      try {
        const response = await fetchWithTimeout("/api/deals/tick", { method: "POST" });
        if (!response.ok) throw new Error("Tick failed.");
        const tick = (await response.json()) as TickResponse;
        await refresh();
        if (!silent) showNotice(buildTickNotice(tick));
      } catch {
        if (!items.length) useLocalDemo();
      }
    },
    [items.length, refresh, showNotice, useLocalDemo],
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        await fetchWithTimeout("/api/deals/tick", { method: "POST" });
        if (!active) return;
        await refresh();
      } catch {
        if (active) useLocalDemo("Demo workspace loaded locally.");
      } finally {
        if (active) setReady(true);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [refresh, useLocalDemo]);

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
      try {
        const response = await fetchWithTimeout(`/api/deals/${id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) throw new Error("Action failed.");
        await refresh();
      } catch {
        setItems((current) => {
          const next = current.map((item) => (item.id === id ? applyHumanAction(item, action) : item));
          setPressure(computePressureStats(next));
          return next;
        });
      }
      showNotice("Decision recorded - workspace queue updated.");
    },
    [refresh, showNotice],
  );

  const resetItems = useCallback(async () => {
    try {
      const response = await fetchWithTimeout("/api/deals/reset?demo=1", { method: "POST" });
      if (!response.ok) throw new Error("Reset failed.");
      await refresh();
      showNotice("Demo workspace reset - Acme 18% scenario restored.");
    } catch {
      useLocalDemo("Demo workspace reset - Acme 18% scenario restored.");
    }
  }, [refresh, showNotice, useLocalDemo]);

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
