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
  deviceName: string | null;
  installationType: "pwa" | "browser" | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: "sent" | "failed" | "removed" | null;
  failureCount: number;
  lastFailureReason: string | null;
}

export interface PushDelivery {
  id: string;
  subscriptionId: string | null;
  type: string;
  component: string | null;
  severity: string | null;
  title: string;
  status: "sent" | "failed" | "removed";
  error: string | null;
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

  subscribe: (
    payload: PushSubscriptionPayload & {
      deviceName?: string;
      installationType?: "pwa" | "browser";
    },
  ) =>
    authenticatedRequest<{ ok: boolean }>("/api/push-subscription", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  unsubscribe: (endpoint: string) =>
    authenticatedRequest<{ ok: boolean }>("/api/push-subscription", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),

  unsubscribeAll: () =>
    authenticatedRequest<{ ok: boolean }>("/api/push-subscription", {
      method: "DELETE",
      body: JSON.stringify({ all: true }),
    }),

  unsubscribeStale: () =>
    authenticatedRequest<{ ok: boolean; removed: number }>(
      "/api/push-subscription",
      {
        method: "DELETE",
        body: JSON.stringify({ stale: true }),
      },
    ),

  rename: (id: string, deviceName: string) =>
    authenticatedRequest<{ ok: boolean; deviceName: string }>(
      "/api/push-subscription",
      {
        method: "PATCH",
        body: JSON.stringify({ id, deviceName }),
      },
    ),

  sendTest: (payload: {
    title: string;
    description?: string;
    subscriptionId?: string;
  }) =>
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

  getStatusPreferences: () =>
    authenticatedRequest<{
      enabled: boolean;
      components: string[];
      severities: string[];
    }>("/api/status-preferences", { method: "GET" }),

  updateStatusPreferences: (prefs: {
    enabled: boolean;
    components: string[];
    severities: string[];
  }) =>
    authenticatedRequest<{
      ok: boolean;
      enabled: boolean;
      components: string[];
      severities: string[];
    }>("/api/status-preferences", {
      method: "PUT",
      body: JSON.stringify(prefs),
    }),

  // Kept for compatibility with an older cached profile chunk while the
  // service worker/Turbopack modules converge after an update.
  deliveryHistory: () =>
    authenticatedRequest<{ deliveries: PushDelivery[] }>(
      "/api/push-delivery-history",
      { method: "GET" },
    ),

  clearDeliveryHistory: () =>
    authenticatedRequest<{ ok: boolean }>("/api/push-delivery-history", {
      method: "DELETE",
    }),
};
