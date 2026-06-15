"use client";

import { useDealRoom } from "@/components/deal-room-provider";

export function DrWorkspaceNotice() {
  const { notice, dismissNotice } = useDealRoom();

  if (!notice) return null;

  return (
    <div className="dr-toast" role="status">
      <span>{notice}</span>
      <button type="button" onClick={dismissNotice} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
