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
 * Router compatibility: the pushed entries carry a marker state. Next.js's own
 * popstate handling ignores unknown history states, so an overlay-dismissing
 * back press never triggers a route change.
 */

const MARKER = "__flowy_overlay__";

type OverlayEntry = { dismiss: () => void; closedByBack: boolean };

const overlayStack: OverlayEntry[] = [];

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
          dismiss: () => dismissRef.current(),
          closedByBack: false,
        };
        entryRef.current = entry;
        overlayStack.push(entry);
        window.history.pushState({ [MARKER]: true }, "");
      }
      return;
    }

    if (entryRef.current) {
      const entry = entryRef.current;
      entryRef.current = null;

      const index = overlayStack.indexOf(entry);
      const wasTop = index === overlayStack.length - 1;
      if (index !== -1) overlayStack.splice(index, 1);

      if (
        wasTop &&
        !entry.closedByBack &&
        window.history.state?.[MARKER] === true
      ) {
        suppressNextPop = true;
        window.history.back();
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
