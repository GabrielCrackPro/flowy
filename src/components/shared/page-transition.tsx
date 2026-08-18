"use client";

import { motion, useAnimationControls } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Plays a subtle entrance on each route change *without* remounting the page
 * subtree. Keying the container by pathname forced every route change to
 * unmount/remount the whole page, re-running heavy providers and effects
 * (e.g. the profile page's data fetches). Instead the container stays mounted
 * and the entrance is re-triggered imperatively.
 *
 * Reduced-motion is handled by the global <MotionConfig reducedMotion="user">,
 * which disables the slide while keeping the opacity fade.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const controls = useAnimationControls();
  const firstRenderRef = useRef(true);

  useIsomorphicLayoutEffect(() => {
    // The initial mount (including hydration) renders in place — no entrance.
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    // Hide synchronously before paint, then ease back in.
    controls.set({ opacity: 0, y: 8 });
    void controls.start(
      { opacity: 1, y: 0 },
      { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    );
  }, [pathname, controls]);

  return (
    <motion.div initial={false} animate={controls}>
      {children}
    </motion.div>
  );
}
