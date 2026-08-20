/**
 * Flowy breakpoint contract — the single source of truth for viewport-based
 * branching (mobile vs desktop chrome).
 *
 * There is exactly ONE layout boundary in the app:
 *
 *   - Mobile:  width < 768px  (Tailwind `md` breakpoint; `useIsMobile()` true)
 *   - Desktop: width >= 768px (Tailwind `md:` and up)
 *
 * Rules:
 *
 * - CSS must use the named Tailwind variants (`md:`, `max-md:`, `sm:`, …)
 *   or the custom `max-compact:` variant defined in `globals.css` — never raw
 *   arbitrary values like `max-[767px]:`. Arbitrary `max-[NNNpx]:` utilities
 *   are exactly what lets the CSS drift from the JS signal.
 * - JS must use `useIsMobile()` (or `useMediaQuery` with a constant from this
 *   file) and never hand-write a query string.
 *
 * Tailwind's default `md` is 48rem = 768px (min-width), so the JS mobile
 * query is `(max-width: 767px)` — keep these two in sync when changing the
 * boundary. The `@custom-variant max-compact` in `globals.css` and the toast
 * container rule at the bottom of that file mirror `COMPACT_MAX_WIDTH` and
 * `TOAST_COMPACT_MAX_WIDTH` here.
 */

/** Viewports <= this are "mobile". Must stay one px below Tailwind's `md`. */
export const MOBILE_MAX_WIDTH = 767;
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

/** Extra-narrow phones (< 420px) get compact search-bar spacing. */
export const COMPACT_MAX_WIDTH = 420;
export const COMPACT_MEDIA_QUERY = `(max-width: ${COMPACT_MAX_WIDTH}px)`;

/**
 * Toast-specific compact viewport: below this, bottom-positioned toasts
 * stretch full-width (see the `[data-sonner-toaster]` rule in globals.css).
 * Deliberately narrower than MOBILE_MAX_WIDTH — a design choice for toasts
 * only, not a layout breakpoint.
 */
export const TOAST_COMPACT_MAX_WIDTH = 600;

/**
 * Installed-PWA display mode. Not a layout breakpoint, but a media query the
 * app reads in several places — keep the string in one spot.
 */
export const STANDALONE_MEDIA_QUERY = "(display-mode: standalone)";

/** True when the app is running as an installed PWA (or iOS "Add to Home"). */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia(STANDALONE_MEDIA_QUERY).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
