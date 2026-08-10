"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChangelogSheet } from "@/components/shared/changelog-sheet";
import { changelog } from "@/lib/changelog";
import {
  getLastSeenChangelogVersion,
  setLastSeenChangelogVersion,
} from "@/lib/changelog/storage";

interface ChangelogContextValue {
  openChangelog: () => void;
}

const ChangelogContext = createContext<ChangelogContextValue | null>(null);

// Brief delay so the sheet doesn't pop over the very first paint.
const AUTO_OPEN_DELAY_MS = 900;

// The auto-open check needs `usePathname`, which reads uncached data. It must
// live inside a Suspense boundary or static prerendering of dashboard routes
// is blocked (same pattern as Header/Sidebar in the dashboard layout).
function ChangelogAutoOpen({ onAutoOpen }: { onAutoOpen: () => void }) {
  const pathname = usePathname();
  const autoOpenedRef = useRef(false);

  // Once per new release, auto-open the sheet when the user lands on the
  // dashboard (auth-gated). Absence of a stored version (first run of the
  // feature) also triggers it — the user sees it once, then it's remembered.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (!pathname?.startsWith("/dashboard")) return;
    if (getLastSeenChangelogVersion() === changelog.currentVersion) return;

    const timer = window.setTimeout(() => {
      // Set the guard when the timer actually fires (not before), so React
      // StrictMode's dev-only double-mount can't cancel the popup: the first
      // mount's cleanup clears the timer while the ref stays untouched.
      autoOpenedRef.current = true;
      onAutoOpen();
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, onAutoOpen]);

  return null;
}

export function ChangelogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openChangelog = useCallback(() => setOpen(true), []);
  const handleAutoOpen = useCallback(() => setOpen(true), []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    // Persist when the sheet closes, so it won't re-open until the next
    // release (even if the user dismisses it without reading).
    if (!next) {
      setLastSeenChangelogVersion(changelog.currentVersion);
    }
  }, []);

  return (
    <ChangelogContext.Provider value={{ openChangelog }}>
      {children}
      <Suspense fallback={null}>
        <ChangelogAutoOpen onAutoOpen={handleAutoOpen} />
      </Suspense>
      <ChangelogSheet open={open} onOpenChange={handleOpenChange} />
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
