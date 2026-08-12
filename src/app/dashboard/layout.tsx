import { Header, Sidebar } from "@components/dashboard";
import { IncidentBanner } from "@components/shared/incident-banner";
import { OfflineBanner } from "@components/shared/offline-banner";
import { PageTransition } from "@components/shared/page-transition";
import { PullToRefresh } from "@components/shared/pull-to-refresh";
import { PushNotificationsBanner } from "@components/shared/push-notifications-banner";
import { PwaShell } from "@components/shared/pwa-shell";
import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Dashboard",
  "See your financial summary, cash flow, budgets, goals, and recurring payments in Flowy.",
  "/dashboard",
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <OfflineBanner />
        </Suspense>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <Suspense fallback={null}>
          <PushNotificationsBanner />
        </Suspense>
        <Suspense fallback={null}>
          <IncidentBanner />
        </Suspense>
        <main
          id="main"
          className="flex-1 overflow-y-auto"
          data-scroll-container
        >
          <Suspense
            fallback={
              <div className="mx-auto w-full max-w-7xl p-4">{children}</div>
            }
          >
            <PageTransition>
              <PullToRefresh>
                <PwaShell>
                  <div className="mx-auto w-full max-w-7xl p-4">{children}</div>
                </PwaShell>
              </PullToRefresh>
            </PageTransition>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
