"use client";

import Link from "next/link";
import { useViewerRole } from "@/components/viewer-role-provider";
import { VIEWER_ROLES } from "@/lib/viewer-role";

type DrNavProps = {
  active?: "dashboard" | "simulation";
};

export function DrNav({ active = "dashboard" }: DrNavProps) {
  const { role, setRole } = useViewerRole();

  return (
    <header className="dr-nav">
      <div className="dr-nav-brand-row">
        <span className="dr-brand">NOVUA DECISION ROOM</span>
        <div className="dr-role-switcher" aria-label="Viewer role">
          {VIEWER_ROLES.map((entry) => (
            <button
              key={entry}
              type="button"
              className={entry === role ? "active" : undefined}
              onClick={() => setRole(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>
      <nav>
        <Link className={active === "dashboard" ? "active" : undefined} href="/dashboard">
          Workspace
        </Link>
        <Link className={active === "simulation" ? "active" : undefined} href="/simulation">
          Simulation
        </Link>
      </nav>
    </header>
  );
}
