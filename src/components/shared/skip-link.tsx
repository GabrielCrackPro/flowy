"use client";

import { useTranslation } from "react-i18next";

/**
 * Skip-to-content link (WCAG 2.4.1 Bypass Blocks).
 * Visually hidden until focused, then appears as the first focusable element
 * and jumps keyboard/screen-reader users straight to <main id="main">.
 */
export function SkipLink() {
  const { t } = useTranslation();

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {t("common.skipToContent")}
    </a>
  );
}
