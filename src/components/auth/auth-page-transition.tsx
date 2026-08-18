"use client";

import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Fades auth pages in on route changes *without* remounting the subtree.
 * The previous implementation keyed the container by pathname inside
 * AnimatePresence `mode="wait"`, which unmounted/remounted the FlagsProvider
 * and page on every auth navigation. Now the container stays mounted and the
 * fade is re-triggered imperatively.
 */
export function AuthPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimationControls();
  const firstRenderRef = useRef(true);

  useIsomorphicLayoutEffect(() => {
    // The initial mount (including hydration) renders in place — no fade.
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (prefersReducedMotion) return;

    // Hide synchronously before paint, then ease back in.
    controls.set({ opacity: 0 });
    void controls.start({ opacity: 1 }, { duration: 0.16, ease: "easeOut" });
  }, [pathname, controls, prefersReducedMotion]);

  return (
    <motion.div initial={false} animate={controls} className="w-full">
      {children}
    </motion.div>
  );
}
