"use client";

import * as React from "react";
import { useSystemBackDismiss } from "@/hooks/useSystemBackDismiss";

interface UseOverlayOpenOptions<Details> {
  /** Controlled open state. Omit to keep the overlay uncontrolled. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean;
  /** Forwarded open-change handler (receives the primitive's event details). */
  onOpenChange?: (open: boolean, details: Details) => void;
}

/**
 * Single source of truth for an overlay primitive's open state + native-back
 * dismissal, so every floating layer — sheets, dialogs, menus, popovers,
 * selects — closes with Android system back / iOS swipe-back / the browser
 * back button instead of navigating away. Pass the returned `open` /
 * `onOpenChange` to the primitive's root.
 *
 * Works in both modes:
 * - controlled: caller owns `open` and receives every change via `onOpenChange`
 * - uncontrolled: internal state initialized from `defaultOpen`
 */
export function useOverlayOpen<Details>({
  open,
  defaultOpen = false,
  onOpenChange,
}: UseOverlayOpenOptions<Details>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const resolvedOpen = open ?? internalOpen;

  const setOpen = React.useCallback(
    (next: boolean, details?: Details) => {
      if (open === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next, details as Details);
    },
    [open, onOpenChange],
  );

  // Native back closes the layer instead of navigating away.
  useSystemBackDismiss(resolvedOpen, () => setOpen(false));

  return { open: resolvedOpen, onOpenChange: setOpen };
}
