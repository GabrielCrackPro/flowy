import type { DashboardAlertVariant } from "@/utils/dashboard";
import { authenticatedRequest } from "./client";

export type InboxAlertSeverity = DashboardAlertVariant;

export interface InboxAlert {
  id: string;
  userId: string;
  spaceId: string | null;
  type: string;
  severity: InboxAlertSeverity;
  fingerprint: string;
  title: string;
  description: string | null;
  data: { url?: string } | null;
  sentAt: string | null;
  readAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  alerts: InboxAlert[];
  unreadCount: number;
}

export const notificationsApi = {
  list: () =>
    authenticatedRequest<NotificationsResponse>("/api/notifications", {
      cache: "no-store",
    }),

  markRead: (body: { ids?: string[]; all?: boolean }) =>
    authenticatedRequest<{ success: boolean }>("/api/notifications/read", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  clearAll: () =>
    authenticatedRequest<{ deletedCount: number }>("/api/notifications", {
      method: "DELETE",
    }),
};
