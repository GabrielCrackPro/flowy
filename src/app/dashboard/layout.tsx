import { Header, Sidebar } from "@components/dashboard";
import { PageTransition } from "@components/shared/page-transition";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Resumen",
};

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
          <Header />
        </Suspense>
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="mx-auto w-full max-w-7xl p-4">{children}</div>
            }
          >
            <PageTransition>
              <div className="mx-auto w-full max-w-7xl p-4">{children}</div>
            </PageTransition>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
