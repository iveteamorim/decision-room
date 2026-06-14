"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { items as seedItems } from "@/engine/deal-room";
import type { WorkItem } from "@/engine/deal-room";
import { applyHumanAction, type HumanAction } from "@/lib/deal-actions";

const STORAGE_KEY = "novua-deal-room-items";

type DealRoomContextValue = {
  items: WorkItem[];
  getItem: (id: string) => WorkItem | undefined;
  runAction: (id: string, action: HumanAction) => void;
  resetItems: () => void;
};

const DealRoomContext = createContext<DealRoomContextValue | null>(null);

export function DealRoomProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WorkItem[]>(seedItems);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as WorkItem[]);
    } catch {
      /* use seed data */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const runAction = useCallback((id: string, action: HumanAction) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? applyHumanAction(item, action) : item)),
    );
  }, []);

  const resetItems = useCallback(() => {
    setItems(seedItems);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      items,
      getItem: (id: string) => items.find((item) => item.id === id),
      runAction,
      resetItems,
    }),
    [items, runAction, resetItems],
  );

  return <DealRoomContext.Provider value={value}>{children}</DealRoomContext.Provider>;
}

export function useDealRoom() {
  const context = useContext(DealRoomContext);
  if (!context) throw new Error("useDealRoom must be used within DealRoomProvider");
  return context;
}
