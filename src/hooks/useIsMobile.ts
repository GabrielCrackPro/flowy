"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MOBILE_MEDIA_QUERY } from "@/lib/breakpoints";

/**
 * True when the viewport is narrower than the Tailwind `md` breakpoint
 * (768px). Reactive to resizes and device rotations.
 *
 * This is the single signal behind the "mobile chrome" — bottom navigation,
 * floating action button, header layout and spacing that render identically
 * for mobile browsers and installed PWAs. Desktop layouts (sidebar) use the
 * CSS `md:` breakpoints, so both stay in sync by construction.
 *
 * Implemented via the shared `useMediaQuery` hook with the contract query
 * from `src/lib/breakpoints.ts` — never hand-write a mobile query string.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}
