"use client";

import { useEffect, useState } from "react";

/**
 * True when the viewport is narrower than the Tailwind `md` breakpoint
 * (768px). Reactive to resizes and device rotations.
 *
 * This is the single signal behind the "mobile chrome" — bottom navigation,
 * floating action button, header layout and spacing that render identically
 * for mobile browsers and installed PWAs. Desktop layouts (sidebar) use the
 * CSS `md:` breakpoints, so both stay in sync by construction.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}
