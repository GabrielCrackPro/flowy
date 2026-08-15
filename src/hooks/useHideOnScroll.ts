"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseHideOnScrollOptions {
  /** Skip observing entirely (e.g. desktop where there is no bottom nav). */
  enabled?: boolean;
  /**
   * While truthy the element never hides (e.g. a menu anchored to it is
   * open). The caller still composes `hidden && !suppress` for the visual
   * state so behavior matches the non-hook implementation.
   */
  suppress?: boolean;
  /** Minimum scroll delta (px) before the visibility flips. */
  threshold?: number;
}

/**
 * Hides a fixed element while the user scrolls down the dashboard's scroll
 * container and reveals it on scroll-up or when back near the top. Shared by
 * the bottom nav and the FAB so both react to scrolling identically.
 */
export function useHideOnScroll({
  enabled = true,
  suppress = false,
  threshold = 8,
}: UseHideOnScrollOptions = {}) {
  const [hidden, setHidden] = useState(false);
  const lastScrollTop = useRef(0);
  const suppressRef = useRef(suppress);
  suppressRef.current = suppress;

  useEffect(() => {
    if (!enabled) return;
    // The dashboard scrolls inside main[data-scroll-container], not the
    // window — the listener must attach there.
    const scrollContainer = document.querySelector<HTMLElement>(
      "[data-scroll-container]",
    );
    if (!scrollContainer) return;

    lastScrollTop.current = scrollContainer.scrollTop;
    const handleScroll = () => {
      if (suppressRef.current) return;
      const currentTop = scrollContainer.scrollTop;
      const delta = currentTop - lastScrollTop.current;
      if (Math.abs(delta) < threshold) return;

      if (currentTop <= 8 || delta < 0) {
        setHidden(false);
      } else if (delta > 0) {
        setHidden(true);
      }
      lastScrollTop.current = currentTop;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [threshold, enabled]);

  const reset = useCallback(() => setHidden(false), []);

  return { hidden, reset };
}
