"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActivities } from "@/lib/api/activity";
import { clearActivities } from "@/lib/api/activity";
import type { Activity, ActivityFilters } from "@/types/Activity";
import { toast } from "@/components/shared/toast";
import { useProfile } from "@/hooks/useProfile";

export function useActivityApi(filters?: ActivityFilters) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;

  const query = useQuery({
    queryKey: ["activities", activeSpaceId, filters],
    queryFn: () => getActivities(filters),
  });

  const clearMutation = useMutation({
    mutationFn: clearActivities,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activities", activeSpaceId],
      });
      toast.success("Actividad eliminada correctamente");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete activity",
      );
    },
  });

  return {
    activities: (query.data as Activity[] | null) ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh: () => query.refetch(),
    clearActivities: () => clearMutation.mutateAsync(),
    isClearing: clearMutation.isPending,
  };
}
