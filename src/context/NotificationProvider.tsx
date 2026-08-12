"use client";

import { Toaster } from "@components/ui/sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { toast } from "sonner";
import { AlertBanner } from "@/components/notifications/alert-banner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  type InboxAlert,
  type NotificationsResponse,
  notificationsApi,
} from "@/lib/api/notifications";
import supabase from "@/lib/supabase/client";

interface AlertInboxContextValue {
  alerts: InboxAlert[];
  unreadCount: number;
  isLoading: boolean;
}

const AlertInboxContext = createContext<AlertInboxContextValue | undefined>(
  undefined,
);

interface RealtimeAlertRow {
  id: string;
  user_id: string;
  space_id: string | null;
  type: string;
  severity: string;
  fingerprint: string;
  title: string;
  description: string | null;
  data: { url?: string } | null;
  sent_at: string | null;
  read_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

function toInboxAlert(row: RealtimeAlertRow): InboxAlert {
  return {
    id: row.id,
    userId: row.user_id,
    spaceId: row.space_id,
    type: row.type,
    severity: row.severity as InboxAlert["severity"],
    fingerprint: row.fingerprint,
    title: row.title,
    description: row.description,
    data: row.data,
    sentAt: row.sent_at,
    readAt: row.read_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

function sortByCreatedAtDesc(alerts: InboxAlert[]): InboxAlert[] {
  return [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const userId = user?.id;
  const activeSpaceId = profile?.activeSpaceId ?? null;
  const queryKey = useMemo(
    () => ["notifications", userId, activeSpaceId] as const,
    [userId, activeSpaceId],
  );

  const query = useQuery({
    queryKey,
    queryFn: notificationsApi.list,
    enabled: !!userId,
    staleTime: 30000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`alerts-inbox-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeAlertRow;
          if (!row) return;

          // Only process alerts for the current space
          if (row.space_id !== activeSpaceId) return;

          const current =
            queryClient.getQueryData<NotificationsResponse>(queryKey);
          if (!current) return;

          const exists = current.alerts.some((item) => item.id === row.id);
          if (exists) return;

          const alert = toInboxAlert(row);

          queryClient.setQueryData<NotificationsResponse>(queryKey, {
            alerts: sortByCreatedAtDesc([alert, ...current.alerts]),
            unreadCount: current.unreadCount + (alert.readAt ? 0 : 1),
          });

          if (!alert.readAt && !alert.resolvedAt) {
            toast.custom(
              () => (
                <AlertBanner
                  alert={alert}
                  onDismiss={() => toast.dismiss(alert.id)}
                />
              ),
              {
                id: alert.id,
                duration: 6000,
                className: "w-full max-w-sm",
              },
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeAlertRow;
          if (!row) return;

          const current =
            queryClient.getQueryData<NotificationsResponse>(queryKey);
          if (!current) return;

          const alert = toInboxAlert(row);

          // Only process alerts for the current space
          if (alert.spaceId !== activeSpaceId) return;

          const alerts = current.alerts.map((item) =>
            item.id === alert.id ? alert : item,
          );
          const unreadCount = alerts.filter(
            (item) => !item.readAt && !item.resolvedAt,
          ).length;

          queryClient.setQueryData<NotificationsResponse>(queryKey, {
            alerts,
            unreadCount,
          });

          if (alert.readAt || alert.resolvedAt) {
            toast.dismiss(alert.id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, activeSpaceId, queryClient, queryKey]);

  // Fallback when realtime is unavailable: the service worker messages the
  // client when a push arrives while the app is open, so refetch alerts.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        void queryClient.invalidateQueries({ queryKey });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [queryClient, queryKey]);

  const value = useMemo<AlertInboxContextValue>(
    () => ({
      alerts: query.data?.alerts ?? [],
      unreadCount: query.data?.unreadCount ?? 0,
      isLoading: query.isPending,
    }),
    [query.data?.alerts, query.data?.unreadCount, query.isPending],
  );

  return (
    <AlertInboxContext.Provider value={value}>
      {children}
      <Toaster />
    </AlertInboxContext.Provider>
  );
}

export function useAlertInbox(): AlertInboxContextValue {
  const context = useContext(AlertInboxContext);
  if (!context) {
    throw new Error("useAlertInbox must be used within a NotificationProvider");
  }
  return context;
}
