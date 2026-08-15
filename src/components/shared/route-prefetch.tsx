"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { getBudgets } from "@/lib/api/budget";
import { getCategories } from "@/lib/api/category";
import { getDashboardData } from "@/lib/api/dashboard";
import { getGoals } from "@/lib/api/goal";
import { getSubscriptions } from "@/lib/api/subscription";
import { getTransactions } from "@/lib/api/transaction";
import { useRouteProgress } from "./route-progress";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const PREFETCH_STALE_TIME = 60_000;

/**
 * Prefetches the destination page's queries the moment a client-side
 * navigation starts (before the bar even completes), so heavy pages like the
 * dashboard and transactions render instantly from cache instead of showing
 * their skeletons. Reads the target route from the URL at navigation start —
 * history.pushState updates window.location before the route commits.
 *
 * Query keys must exactly match what each page's hooks produce (see
 * useDashboardData and useEntityApi), including the space id and filters.
 */
function RoutePrefetchInner() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { isNavigating, isOnline } = useRouteProgress();
  const currentPathname = usePathname();
  const prefetchedForRef = useRef<string | null>(null);

  const activeSpaceId = profile?.activeSpaceId ?? null;

  useEffect(() => {
    // Offline: don't fire doomed requests — the cached page renders directly.
    if (!isNavigating || !isOnline) return;

    // At navigation start the URL already reflects the destination.
    const target = window.location.pathname;
    if (target === currentPathname) return;
    if (prefetchedForRef.current === target) return;
    prefetchedForRef.current = target;

    const prefetch = (queryKey: unknown[], queryFn: () => Promise<unknown>) => {
      void queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: PREFETCH_STALE_TIME,
        retry: false,
      });
    };

    if (target === "/dashboard") {
      // The dashboard reads its month/year from localStorage (page default:
      // current month/year).
      const now = new Date();
      const storedMonth = Number(window.localStorage.getItem("flowy.month"));
      const storedYear = Number(window.localStorage.getItem("flowy.year"));
      const month =
        Number.isInteger(storedMonth) && storedMonth >= 1 && storedMonth <= 12
          ? storedMonth
          : now.getMonth() + 1;
      const year =
        Number.isInteger(storedYear) && storedYear >= 2000
          ? storedYear
          : now.getFullYear();

      prefetch(["dashboard", activeSpaceId, month, year], () =>
        getDashboardData(month, year),
      );
      // Cards render budgets/goals/subscriptions from their own queries.
      prefetch(["budgets", activeSpaceId, undefined], () => getBudgets());
      prefetch(["goals", activeSpaceId, undefined], () => getGoals());
      prefetch(["subscriptions", activeSpaceId, undefined], () =>
        getSubscriptions(),
      );
    } else if (target === "/dashboard/transactions") {
      // Default filter state: no filters + first page.
      prefetch(
        [
          "transactions",
          activeSpaceId,
          { page: DEFAULT_PAGE, limit: DEFAULT_LIMIT },
        ],
        () => getTransactions({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT }),
      );
      // The transactions page also loads categories for its filter options.
      prefetch(["categories", activeSpaceId, undefined], () => getCategories());
    } else if (target === "/dashboard/budgets") {
      prefetch(["budgets", activeSpaceId, undefined], () => getBudgets());
      prefetch(["categories", activeSpaceId, undefined], () => getCategories());
    } else if (target === "/dashboard/goals") {
      prefetch(["goals", activeSpaceId, undefined], () => getGoals());
    } else if (target === "/dashboard/subscriptions") {
      prefetch(["subscriptions", activeSpaceId, undefined], () =>
        getSubscriptions(),
      );
    } else if (target === "/dashboard/categories") {
      prefetch(["categories", activeSpaceId, undefined], () => getCategories());
    }
  }, [isNavigating, isOnline, activeSpaceId, currentPathname, queryClient]);

  return null;
}

/**
 * Wrapped in Suspense so the external-store read (useRouteProgress) is inside
 * a boundary during prerender — otherwise Next 16's cacheComponents flags the
 * static catch-all routes as blocking ("Uncached data was accessed outside of
 * <Suspense>"). RouteProgress follows the same pattern.
 */
export function RoutePrefetch() {
  return (
    <Suspense fallback={null}>
      <RoutePrefetchInner />
    </Suspense>
  );
}
