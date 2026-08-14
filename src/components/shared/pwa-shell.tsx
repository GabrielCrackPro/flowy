"use client";

import { PwaBottomNav } from "@/components/shared/pwa-bottom-nav";
import { PwaFab } from "@/components/shared/pwa-fab";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Mobile shell shared by mobile browsers and installed PWAs.
 *
 * Adds bottom padding for the nav bar and renders both the bottom navigation
 * bar and the floating action button on every mobile-sized viewport (not just
 * standalone mode), so the mobile experience is identical in a browser tab and
 * as an installed app. On desktop these elements are hidden and the sidebar
 * takes over.
 *
 * Wrap the dashboard layout's children with this to ensure content
 * doesn't get hidden behind the fixed bottom elements.
 */
export function PwaShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <>
      <div className={isMobile ? "pb-20" : undefined}>{children}</div>
      <PwaFab />
      <PwaBottomNav />
    </>
  );
}
