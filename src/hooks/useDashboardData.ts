"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/api/dashboard";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/components/shared/toast";
import {
  classifyError,
  RateLimitError,
  ErrorTranslationKeys,
} from "@/lib/errors/error-types";
import { useTranslation } from "react-i18next";

export function useDashboardData(month?: number, year?: number) {
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;
  const { t } = useTranslation();

  return useQuery({
    queryKey: ["dashboard", activeSpaceId, month, year],
    queryFn: () => getDashboardData(month, year),
    enabled: month != null && year != null,
    staleTime: 10000,
    onError: (error) => {
      const classifiedError = classifyError(error);
      if (classifiedError instanceof RateLimitError) {
        toast.rateLimit(
          t(ErrorTranslationKeys.RATE_LIMIT),
          classifiedError.getRemainingTime(),
        );
      }
    },
  });
}
