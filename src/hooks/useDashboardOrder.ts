"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useProfile } from "@/hooks/useProfile";
import {
  ALL_DASHBOARD_CARDS,
  type DashboardCardId,
  normalizeDashboardOrder,
} from "@/lib/dashboard-cards";

/**
 * Card order persisted on the user's profile (like `dashboardCards`), with a
 * local optimistic draft so drag reordering feels instant while the write is
 * debounced. The draft is dropped on failure so the UI falls back to the last
 * persisted order.
 */
export function useDashboardOrder() {
  const { profile, update } = useProfile();
  const [draft, setDraft] = useState<DashboardCardId[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const order = draft ?? normalizeDashboardOrder(profile?.dashboardOrder);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const setOrder = useCallback(
    (next: DashboardCardId[]) => {
      setDraft(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void update({ dashboardOrder: next }).catch(() => setDraft(null));
      }, 400);
    },
    [update],
  );

  const resetOrder = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setDraft([...ALL_DASHBOARD_CARDS]);
  }, []);

  return { order, setOrder, resetOrder };
}
