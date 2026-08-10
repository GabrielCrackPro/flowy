"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ChangelogSheet } from "@/components/shared/changelog-sheet";

interface ChangelogContextValue {
  openChangelog: () => void;
}

const ChangelogContext = createContext<ChangelogContextValue | null>(null);

export function ChangelogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openChangelog = useCallback(() => setOpen(true), []);

  return (
    <ChangelogContext.Provider value={{ openChangelog }}>
      {children}
      <ChangelogSheet open={open} onOpenChange={setOpen} />
    </ChangelogContext.Provider>
  );
}

export function useChangelog() {
  const context = useContext(ChangelogContext);
  if (!context) {
    throw new Error("useChangelog must be used within ChangelogProvider");
  }
  return context;
}
