import webpush from "web-push";
import { prisma } from "@/lib/prisma/client";
import { PUSH_ALERTS_DISABLED } from "@/lib/push-preferences";

export interface PushAlertPayload {
  title: string;
  description?: string | null;
  url?: string | null;
  tag?: string;
  /** Alert type, used to honor per-type push preferences. Absent on test pushes. */
  type?: string;
  /** Status component, used to honor per-component status alert preferences. */
  component?: string;
  /** Alert severity, used to honor per-severity status preferences. */
  severity?: string;
}

const NOTIFICATION_ICON = "/icons/icon-192.png";
const NOTIFICATION_TTL_SECONDS = 60 * 60 * 24; // 24h

type DeliveryStatus = "sent" | "failed" | "removed";

function summarizeDeliveryError(error: unknown): string {
  const statusCode = (error as { statusCode?: number }).statusCode;
  if (statusCode === 404 || statusCode === 410) {
    return "subscription_expired";
  }
  if (typeof statusCode === "number") {
    return `provider_http_${statusCode}`;
  }
  return "provider_rejected_delivery";
}

async function recordDelivery({
  userId,
  subscriptionId,
  alert,
  status,
  error,
}: {
  userId: string;
  subscriptionId: string;
  alert: PushAlertPayload;
  status: DeliveryStatus;
  error?: string;
}): Promise<void> {
  try {
    const now = new Date();
    await prisma.pushDelivery.create({
      data: {
        userId,
        subscriptionId,
        type: alert.type ?? "status",
        component: alert.component ?? null,
        severity: alert.severity ?? null,
        title: alert.title,
        status,
        error: error?.slice(0, 1000) ?? null,
      },
    });
    await prisma.pushSubscription.update({
      where: { id: subscriptionId },
      data: {
        lastSeenAt: now,
        lastDeliveryAt: now,
        lastDeliveryStatus: status,
        ...(status === "failed"
          ? {
              failureCount: { increment: 1 },
              lastFailureReason: error?.slice(0, 200) ?? null,
            }
          : { failureCount: 0, lastFailureReason: null }),
      },
    });
  } catch (recordError) {
    console.error("Push delivery history failed:", recordError);
  }
}

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

export interface SaveSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceName?: string;
  installationType?: "pwa" | "browser";
}

export const PushService = {
  /** Whether VAPID keys are configured (used by the status page). */
  isConfigured(): boolean {
    return (
      Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
      Boolean(process.env.VAPID_PRIVATE_KEY)
    );
  },
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
    subscriptionId?: string,
  ): Promise<{ sent: number; removed: number }> {
    // A unique tag per test keeps each send a fresh toast: reusing the same
    // tag makes the OS silently *update* the previous toast instead of
    // popping a new one, which reads as "notifications stopped working".
    return this.sendAlertsToUser(
      userId,
      [
        {
          ...test,
          type: test.type ?? "test",
          tag: test.tag ?? `flowy-test-${Date.now()}`,
        },
      ],
      subscriptionId,
    );
  },

  async sendAlertsToUser(
    userId: string,
    alerts: PushAlertPayload[],
    subscriptionId?: string,
  ): Promise<{ sent: number; removed: number }> {
    const client = getWebPushClient();
    if (!client || alerts.length === 0) {
      return { sent: 0, removed: 0 };
    }

    // Honor per-alert-type push preferences. An empty stored list means all
    // types are enabled (legacy default), while the explicit sentinel means
    // all financial alerts are disabled. Alerts without a type (test pushes)
    // always go through.
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { pushPreferences: true },
    });
    const prefs = profile?.pushPreferences ?? [];
    const enabled = prefs.includes(PUSH_ALERTS_DISABLED)
      ? new Set<string>()
      : prefs.length === 0
        ? null
        : new Set(prefs);
    const toSend = alerts.filter(
      (alert) =>
        alert.type === "test" ||
        !alert.type ||
        !enabled ||
        enabled.has(alert.type),
    );
    if (toSend.length === 0) {
      return { sent: 0, removed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId, ...(subscriptionId ? { id: subscriptionId } : {}) },
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
          await recordDelivery({
            userId,
            subscriptionId: subscription.id,
            alert,
            status: "sent",
          });
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          const deliveryStatus: DeliveryStatus =
            statusCode === 404 || statusCode === 410 ? "removed" : "failed";
          await recordDelivery({
            userId,
            subscriptionId: subscription.id,
            alert,
            status: deliveryStatus,
            error: summarizeDeliveryError(error),
          });
          if (deliveryStatus === "removed") {
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

  /**
   * Sends alerts to every device subscribed across all users (used for
   * platform-wide notices like the status page). Honors each user's status
   * alert preferences (master switch + per-component opt-outs). Stale
   * subscriptions (404/410) are removed from the database.
   */
  async broadcast(
    alerts: PushAlertPayload[],
  ): Promise<{ sent: number; removed: number }> {
    const client = getWebPushClient();
    if (!client || alerts.length === 0) {
      return { sent: 0, removed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      select: {
        id: true,
        userId: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    // Load each affected user's status alert preferences once, keyed by user.
    const userIds = [...new Set(subscriptions.map((s) => s.userId))];
    const profiles = await prisma.profile.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        preferences: true,
      },
    });
    const prefsByUser = new Map(
      profiles.map((p) => {
        const prefs = (p.preferences as Record<string, unknown>) ?? {};
        return [
          p.id,
          {
            enabled: (prefs.statusAlertsEnabled as boolean) ?? true,
            components: (prefs.statusAlertComponents as string[]) ?? [],
            severities: (prefs.statusAlertSeverities as string[]) ?? [],
          },
        ];
      }),
    );

    let sent = 0;
    let removed = 0;

    for (const subscription of subscriptions) {
      const prefs = prefsByUser.get(subscription.userId);
      // Users without a profile row default to receiving everything.
      const enabled = prefs ? prefs.enabled : true;
      if (!enabled) continue;
      const allowedComponents = prefs ? prefs.components : [];
      const allowedSeverities = prefs ? prefs.severities : [];

      for (const alert of alerts) {
        // Empty component/severity lists = all values (legacy default).
        if (
          (alert.component &&
            allowedComponents.length > 0 &&
            !allowedComponents.includes(alert.component)) ||
          (alert.severity &&
            allowedSeverities.length > 0 &&
            !allowedSeverities.includes(alert.severity))
        ) {
          continue;
        }

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
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
            { TTL: NOTIFICATION_TTL_SECONDS },
          );
          sent += 1;
          await recordDelivery({
            userId: subscription.userId,
            subscriptionId: subscription.id,
            alert,
            status: "sent",
          });
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          const deliveryStatus: DeliveryStatus =
            statusCode === 404 || statusCode === 410 ? "removed" : "failed";
          await recordDelivery({
            userId: subscription.userId,
            subscriptionId: subscription.id,
            alert,
            status: deliveryStatus,
            error: summarizeDeliveryError(error),
          });
          if (deliveryStatus === "removed") {
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

  /**
   * Registers or refreshes a push subscription, transferring ownership if
   * the endpoint was previously registered by another user.
   */
  async saveSubscription(
    userId: string,
    input: SaveSubscriptionInput,
    userAgent: string | null,
  ) {
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: input.endpoint },
      select: { userId: true },
    });
    if (existing && existing.userId !== userId) {
      return { conflict: true };
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: userAgent?.slice(0, 300) ?? null,
        deviceName: input.deviceName ?? null,
        installationType: input.installationType ?? null,
        lastSeenAt: new Date(),
      },
      update: {
        userId,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: userAgent?.slice(0, 300) ?? null,
        ...(input.deviceName ? { deviceName: input.deviceName } : {}),
        ...(input.installationType
          ? { installationType: input.installationType }
          : {}),
        lastSeenAt: new Date(),
      },
    });

    return { conflict: false, id: subscription.id };
  },

  async listSubscriptions(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        deviceName: true,
        installationType: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
        lastDeliveryAt: true,
        lastDeliveryStatus: true,
        failureCount: true,
        lastFailureReason: true,
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async renameSubscription(
    userId: string,
    id: string,
    deviceName: string,
  ): Promise<boolean> {
    const updated = await prisma.pushSubscription.updateMany({
      where: { id, userId },
      data: { deviceName },
    });
    return updated.count > 0;
  },

  async deleteSubscriptions(
    userId: string,
    options: { all?: boolean; stale?: boolean; endpoint?: string },
  ) {
    if (options.all) {
      await prisma.pushSubscription.deleteMany({ where: { userId } });
      return;
    }

    if (options.stale) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          OR: [
            { lastSeenAt: { lt: cutoff } },
            { lastSeenAt: null, updatedAt: { lt: cutoff } },
          ],
        },
      });
      return result.count;
    }

    if (options.endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: options.endpoint, userId },
      });
    }
  },

  async getDeliveryHistory(userId: string) {
    const deliveries = await prisma.pushDelivery.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        subscriptionId: true,
        type: true,
        component: true,
        severity: true,
        title: true,
        status: true,
        error: true,
        createdAt: true,
      },
    });

    return deliveries.map((delivery) => ({
      ...delivery,
      createdAt: delivery.createdAt.toISOString(),
    }));
  },

  async clearDeliveryHistory(userId: string) {
    await prisma.pushDelivery.deleteMany({
      where: { userId },
    });
    return { ok: true };
  },
};
