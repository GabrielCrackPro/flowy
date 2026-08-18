"use client";

import * as React from "react";

/**
 * Closes modal overlays (sheets, dialogs) with the native back affordance —
 * Android system back, iOS swipe-back, and the browser's back button/gesture.
 *
 * How it works:
 * - Every overlay that opens pushes a same-URL history entry. A `popstate`
 *   event (a real back press) pops the *top* overlay off a module-level LIFO
 *   stack, so stacked overlays close in the right order and one back press
 *   never skips an entire layer.
 * - When an overlay closes through its own UI (scrim, ✕, submit), its history
 *   entry is consumed with `history.back()` so no dead back-presses
 *   accumulate — unless the browser already consumed it via system back or a
 *   newer overlay sits above it (its entry is still needed).
 *
 * Router compatibility: Next.js App Router copies its internal `__NA` marker
 * onto our pushed entries, so popping one dispatches ACTION_RESTORE to the
 * current URL. With no navigation in flight that is a harmless no-op (the
 * back-to-dismiss behavior); the cleanup is deferred so it can never pop the
 * entry while a navigation is pending (which would cancel it).
 */

const MARKER = "__flowy_overlay__";

type OverlayEntry = { id: number; dismiss: () => void; closedByBack: boolean };

const overlayStack: OverlayEntry[] = [];
let nextEntryId = 0;

// Swallows the popstate produced by our own `history.back()` when consuming a
// UI-closed overlay's entry — that event must not close the overlay beneath it.
let suppressNextPop = false;

let listenerInstalled = false;

function ensureListener() {
  if (listenerInstalled || typeof window === "undefined") return;
  listenerInstalled = true;

  window.addEventListener("popstate", () => {
    if (suppressNextPop) {
      suppressNextPop = false;
      return;
    }

    const top = overlayStack.pop();
    if (top) {
      top.closedByBack = true;
      top.dismiss();
    }
  });
}

export function useSystemBackDismiss(open: boolean, onDismiss: () => void) {
  const dismissRef = React.useRef(onDismiss);
  dismissRef.current = onDismiss;

  const entryRef = React.useRef<OverlayEntry | null>(null);

  React.useEffect(() => {
    ensureListener();

    if (open) {
      if (!entryRef.current) {
        const entry: OverlayEntry = {
          id: nextEntryId++,
          dismiss: () => dismissRef.current(),
          closedByBack: false,
        };
        entryRef.current = entry;
        overlayStack.push(entry);
        window.history.pushState({ [MARKER]: true, id: entry.id }, "");
      }
      return;
    }

    if (entryRef.current) {
      const entry = entryRef.current;
      entryRef.current = null;

      const index = overlayStack.indexOf(entry);
      const wasTop = index === overlayStack.length - 1;
      if (index !== -1) overlayStack.splice(index, 1);

      if (wasTop && !entry.closedByBack) {
        // Defer the history cleanup and poll briefly. If the overlay closed
        // while a router navigation is in flight (e.g. a sheet/menu item
        // that navigates as it closes), popping our marker fires popstate
        // and Next.js dispatches ACTION_RESTORE — silently cancelling the
        // pending navigation. router.push runs inside startTransition, so
        // the router's optimistic history entry lands a moment after this
        // effect; the poll waits for it, and once the top entry is no longer
        // ours the pop is skipped (the navigation wins). If nothing
        // navigated, the marker stays on top and the poll consumes it as
        // usual. The per-entry id also guards against consuming a newer
        // overlay's entry when one opened on top in the meantime.
        const STEP_MS = 25;
        const MAX_MS = 300;
        let elapsed = 0;
        const consume = () => {
          if (window.history.state?.id === entry.id) {
            suppressNextPop = true;
            window.history.back();
          }
        };
        const poll = () => {
          if (window.history.state?.id !== entry.id) return;
          elapsed += STEP_MS;
          if (elapsed >= MAX_MS) {
            consume();
          } else {
            window.setTimeout(poll, STEP_MS);
          }
        };
        poll();
      }
    }
  }, [open]);

  // Unmount safety: if an overlay is unmounted while open (e.g. during a route
  // change), drop its stack entry without touching history — consuming the
  // entry with `history.back()` here would undo the navigation. A back press
  // on the lingering entry is then a harmless no-op (empty stack).
  React.useEffect(() => {
    return () => {
      if (!entryRef.current) return;
      const entry = entryRef.current;
      entryRef.current = null;
      const index = overlayStack.indexOf(entry);
      if (index !== -1) overlayStack.splice(index, 1);
    };
  }, []);
}
