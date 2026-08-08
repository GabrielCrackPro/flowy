"use client";

import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { getDashboardData } from "@/lib/api/dashboard";

export function useDashboardData(month?: number, year?: number) {
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;

  return useQuery({
    queryKey: ["dashboard", activeSpaceId, month, year],
    queryFn: () => getDashboardData(month, year),
    enabled: month != null && year != null,
    staleTime: 10000,
    refetchInterval: 60000, // Poll in the background to catch realtime misses
    refetchIntervalInBackground: false, // Only while the tab is visible
  });
}
