"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/api/dashboard";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from "react-i18next";

export function useDashboardData(month?: number, year?: number) {
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;

  return useQuery({
    queryKey: ["dashboard", activeSpaceId, month, year],
    queryFn: () => getDashboardData(month, year),
    enabled: month != null && year != null,
    staleTime: 10000,
  });
}
