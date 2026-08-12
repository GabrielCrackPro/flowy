"use client";

import type { HapticPattern } from "@/hooks/usePwa";
import { usePwa } from "@/hooks/usePwa";

/**
 * Returns a `vibrate(pattern)` function that only fires when:
 * 1. The app is installed as a PWA (`display-mode: standalone`), and
 * 2. `navigator.vibrate` is supported.
 *
 * Safe to call unconditionally — silently no-ops otherwise.
 *
 * @deprecated Prefer `usePwa().vibrate` for new code. This hook is kept for
 * backward compatibility and delegates to `usePwa` internally.
 */
export function useHaptic() {
  const { vibrate } = usePwa();
  return vibrate;
}

export type { HapticPattern };
