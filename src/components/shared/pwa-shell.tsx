"use client";

import { PwaBottomNav } from "@/components/shared/pwa-bottom-nav";
import { PwaFab } from "@/components/shared/pwa-fab";
import { usePwa } from "@/hooks/usePwa";

/**
 * PWA shell that adds bottom padding for the nav bar and renders both the
 * bottom navigation bar and the floating action button in standalone mode.
 *
 * Wrap the dashboard layout's children with this to ensure content
 * doesn't get hidden behind the fixed bottom elements.
 */
export function PwaShell({ children }: { children: React.ReactNode }) {
  const { isStandalone } = usePwa();

  return (
    <>
      <div className={isStandalone ? "pb-20" : undefined}>{children}</div>
      <PwaFab />
      <PwaBottomNav />
    </>
  );
}
