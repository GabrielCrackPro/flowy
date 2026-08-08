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
};
