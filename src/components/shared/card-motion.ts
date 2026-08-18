"use client";

import { useReducedMotion, type Variants } from "framer-motion";

/** Delay between siblings in a card's entrance cascade (seconds). */
export const CARD_STAGGER = 0.06;

/**
 * Shared, reduced-motion-aware entrance animation for dashboard cards.
 *
 * The parent element uses `container` (staggerChildren) and each child uses
 * `item` (fade + rise), so lists cascade in consistently. When the user
 * prefers reduced motion both variants collapse to `{}`, disabling the
 * entrance animation and stagger delays entirely (transforms are already
 * suppressed by the root `MotionConfig reducedMotion="user"`, but this also
 * removes the opacity fade + cascade).
 */
export function useCardMotion() {
  const reduced = useReducedMotion() ?? false;

  const container: Variants = reduced
    ? {}
    : {
        hidden: {},
        show: { transition: { staggerChildren: CARD_STAGGER } },
      };

  const item: Variants = reduced
    ? {}
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      };

  return { reduced, container, item };
}
