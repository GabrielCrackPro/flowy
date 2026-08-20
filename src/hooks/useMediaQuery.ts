"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Cache MediaQueryList instances per query so re-renders don't re-create them. */
const mediaQueryCache = new Map<string, MediaQueryList>();

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  let mql = mediaQueryCache.get(query);
  if (!mql) {
    mql = window.matchMedia(query);
    mediaQueryCache.set(query, mql);
  }
  return mql;
}

/**
 * Reactive `matchMedia` hook.
 *
 * Implemented with `useSyncExternalStore` + a cached `MediaQueryList`: the
 * server snapshot is `serverValue` (default `false`) so SSR and hydration
 * markup match, then React re-renders synchronously with the real value right
 * after hydration — before the browser paints. Consumers never see a flash of
 * the "wrong" variant.
 *
 * Prefer the domain hooks over calling this directly:
 * - `useIsMobile()` — the `md` boundary (mobile vs desktop chrome)
 * - constants from `src/lib/breakpoints.ts` for anything else
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = getMediaQueryList(query);
      if (!mql) return () => {};
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => getMediaQueryList(query)?.matches ?? serverValue,
    [query, serverValue],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}
