"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAlertInbox } from "@/context/NotificationProvider";
import { useProfile } from "@/hooks/useProfile";
import {
  type NotificationsResponse,
  notificationsApi,
} from "@/lib/api/notifications";

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;
  const { alerts, unreadCount, isLoading } = useAlertInbox();
  const queryKey = ["notifications", userId, activeSpaceId] as const;

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: (_data, variables) => {
      const current = queryClient.getQueryData<NotificationsResponse>(queryKey);
      if (!current) return;

      queryClient.setQueryData<NotificationsResponse>(queryKey, {
        alerts: current.alerts.map((alert) => {
          if (variables.all) {
            return { ...alert, readAt: new Date().toISOString() };
          }
          return variables.ids?.includes(alert.id)
            ? { ...alert, readAt: new Date().toISOString() }
            : alert;
        }),
        unreadCount: variables.all
          ? 0
          : Math.max(0, current.unreadCount - (variables.ids?.length ?? 0)),
      });
    },
  });

  const dismiss = useCallback(
    (id: string) => {
      return markReadMutation.mutateAsync({ ids: [id] });
    },
    [markReadMutation],
  );

  return {
    alerts,
    unreadCount,
    isLoading,
    dismiss,
  };
}
