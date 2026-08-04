"use client";

import { useCallback } from "react";

import { useProfile } from "@/hooks/useProfile";
import {
  ALL_DASHBOARD_CARDS,
  type DashboardCardId,
} from "@/lib/dashboard-cards";

export function useDashboardCards() {
  const { profile, update } = useProfile();

  const enabled = profile?.dashboardCards ?? null;

  const isCardEnabled = useCallback(
    (id: DashboardCardId) => {
      if (enabled == null) return true;
      return enabled.includes(id);
    },
    [enabled],
  );

  const setCardEnabled = useCallback(
    async (id: DashboardCardId, visible: boolean) => {
      if (!profile) return;
      const current = enabled ?? ALL_DASHBOARD_CARDS;
      const next = visible
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((card) => card !== id);
      await update({ dashboardCards: [...next] });
    },
    [profile, enabled, update],
  );

  const resetCards = useCallback(async () => {
    if (!profile) return;
    await update({ dashboardCards: null });
  }, [profile, update]);

  return { isCardEnabled, setCardEnabled, resetCards };
}
