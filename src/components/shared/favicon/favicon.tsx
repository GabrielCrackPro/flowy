"use client";

import { useEffect, useRef } from "react";
import { useThemeContext } from "@/context/ThemeContext";

const FAVICONS = {
  light: "/favicon-light.svg?v=2",
  dark: "/favicon-dark.svg?v=2",
} as const;

export function Favicon() {
  const { resolvedTheme } = useThemeContext();
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (!resolvedTheme) return;

    linkRef.current?.remove();

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.sizes = "any";
    link.href = FAVICONS[resolvedTheme];
    linkRef.current = link;
    document.head.appendChild(link);
  }, [resolvedTheme]);

  return null;
}
