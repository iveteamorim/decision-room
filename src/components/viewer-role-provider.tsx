"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadViewerRole,
  saveViewerRole,
  type ViewerRole,
} from "@/lib/viewer-role";

type ViewerRoleContextValue = {
  role: ViewerRole;
  setRole: (role: ViewerRole) => void;
};

const ViewerRoleContext = createContext<ViewerRoleContextValue | null>(null);

export function ViewerRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<ViewerRole>("Finance");

  useEffect(() => {
    setRoleState(loadViewerRole());
  }, []);

  const setRole = (nextRole: ViewerRole) => {
    setRoleState(nextRole);
    saveViewerRole(nextRole);
  };

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <ViewerRoleContext.Provider value={value}>{children}</ViewerRoleContext.Provider>;
}

export function useViewerRole() {
  const context = useContext(ViewerRoleContext);
  if (!context) throw new Error("useViewerRole must be used within ViewerRoleProvider");
  return context;
}
