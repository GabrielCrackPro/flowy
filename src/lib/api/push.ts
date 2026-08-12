import { authenticatedRequest } from "./client";

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushDevice {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
}

export const pushApi = {
  status: () =>
    authenticatedRequest<{
      ok: boolean;
      subscribed: boolean;
      count: number;
      subscriptions: PushDevice[];
    }>("/api/push-subscription", { method: "GET" }),

  subscribe: (payload: PushSubscriptionPayload) =>
    authenticatedRequest<{ ok: boolean }>("/api/push-subscription", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  unsubscribe: (endpoint: string) =>
    authenticatedRequest<{ ok: boolean }>("/api/push-subscription", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),

  sendTest: (payload: { title: string; description?: string }) =>
    authenticatedRequest<{ ok: boolean; sent: number }>(
      "/api/push-subscription/test",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  getPreferences: () =>
    authenticatedRequest<{ preferences: string[] }>("/api/push-preferences", {
      method: "GET",
    }),

  updatePreferences: (preferences: string[]) =>
    authenticatedRequest<{ ok: boolean; preferences: string[] }>(
      "/api/push-preferences",
      {
        method: "PUT",
        body: JSON.stringify({ preferences }),
      },
    ),
};
