import webpush from "web-push";

import { prisma } from "@/lib/prisma/client";

export interface PushAlertPayload {
  title: string;
  description?: string | null;
  url?: string | null;
  tag?: string;
  /** Alert type, used to honor per-type push preferences. Absent on test pushes. */
  type?: string;
}

const NOTIFICATION_ICON = "/icons/icon-192.png";
const NOTIFICATION_TTL_SECONDS = 60 * 60 * 24; // 24h

function getWebPushClient(): typeof webpush | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return null;
  }

  const subject = process.env.VAPID_SUBJECT ?? "mailto:no-reply@flowy.app";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export const PushService = {
  /**
   * Delivers push notifications for the given alerts to every device
   * subscribed by the user. Subscriptions that no longer exist on the push
   * service (404/410) are removed from the database.
   */
  /**
   * Sends a test notification to every device subscribed by the user, so they
   * can verify push delivery works after enabling it. The caller passes the
   * already-localized title/description.
   */
  async sendTestToUser(
    userId: string,
    test: PushAlertPayload,
  ): Promise<{ sent: number; removed: number }> {
    // A unique tag per test keeps each send a fresh toast: reusing the same
    // tag makes the OS silently *update* the previous toast instead of
    // popping a new one, which reads as "notifications stopped working".
    return this.sendAlertsToUser(userId, [
      { ...test, tag: test.tag ?? `flowy-test-${Date.now()}` },
    ]);
  },

  async sendAlertsToUser(
    userId: string,
    alerts: PushAlertPayload[],
  ): Promise<{ sent: number; removed: number }> {
    const client = getWebPushClient();
    if (!client || alerts.length === 0) {
      return { sent: 0, removed: 0 };
    }

    // Honor per-alert-type push preferences. An empty stored list means all
    // types are enabled (legacy default); alerts without a type (test pushes)
    // always go through.
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { pushPreferences: true },
    });
    const prefs = profile?.pushPreferences ?? [];
    const enabled = prefs.length === 0 ? null : new Set(prefs);
    const toSend = alerts.filter(
      (alert) => !alert.type || !enabled || enabled.has(alert.type),
    );
    if (toSend.length === 0) {
      return { sent: 0, removed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    let sent = 0;
    let removed = 0;

    for (const subscription of subscriptions) {
      for (const alert of toSend) {
        const payload = JSON.stringify({
          title: alert.title,
          body: alert.description ?? undefined,
          url: alert.url ?? "/dashboard",
          tag: alert.tag,
          icon: NOTIFICATION_ICON,
          badge: NOTIFICATION_ICON,
        });

        try {
          await client.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
            { TTL: NOTIFICATION_TTL_SECONDS },
          );
          sent += 1;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.deleteMany({
              where: { id: subscription.id },
            });
            removed += 1;
          } else {
            console.error("Push notification delivery failed", error);
          }
        }
      }
    }

    return { sent, removed };
  },
};
