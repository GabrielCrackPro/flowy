import { authenticatedRequest } from "./client";

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export const pushApi = {
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
};
