import { getServerT } from "@/lib/i18n";
import { prisma } from "@/lib/prisma/client";
import {
  buildDashboardAlerts,
  type DashboardAlertType,
} from "@/utils/dashboard";
import { DashboardService } from "./dashboard";
import { SpaceService } from "./spaces/space-service";

const ALERT_URLS: Record<DashboardAlertType, string> = {
  overspending: "/dashboard",
  "budget-exceeded": "/dashboard/budgets",
  "budget-near": "/dashboard/budgets",
  "upcoming-payment": "/dashboard/subscriptions",
  "goal-deadline": "/dashboard/goals",
  "goal-achieved": "/dashboard/goals",
  "low-savings": "/dashboard",
  "no-budgets": "/dashboard/budgets",
};

export interface CreatedAlert {
  type: string;
  severity: string;
  title: string;
  description: string | null;
  data: { url: string } | null;
}

export const AlertsService = {
  /**
   * Evaluates the user's current financial state, persists any new alerts
   * (deduplicated by fingerprint) and returns the alerts that were created
   * so callers can deliver push notifications for them.
   */
  async evaluateForUser(
    userId: string,
  ): Promise<{ created: number; alerts: CreatedAlert[] }> {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return { created: 0, alerts: [] };
    }

    const [data, t, activeSpace] = await Promise.all([
      DashboardService.getDashboard(userId),
      getServerT(profile.locale),
      SpaceService.getCurrent(userId),
    ]);

    const spaceId = activeSpace?.id ?? null;

    // Evaluate every active condition, not just the top few: the dashboard
    // strip caps its display, but alerts and pushes must fire for all types.
    const candidates = buildDashboardAlerts(
      data,
      profile.locale,
      profile.currency,
      t,
      Number.POSITIVE_INFINITY,
    );
    const fingerprints = candidates.map((candidate) => candidate.id);

    const existing = await prisma.alert.findMany({
      where: {
        userId,
        spaceId,
        fingerprint: { in: fingerprints },
      },
      select: { fingerprint: true },
    });
    const known = new Set(existing.map((alert) => alert.fingerprint));

    // Resolve alerts whose condition no longer applies (only for current space).
    await prisma.alert.updateMany({
      where: {
        userId,
        spaceId,
        resolvedAt: null,
        fingerprint: { notIn: fingerprints },
      },
      data: { resolvedAt: new Date() },
    });

    const now = new Date();
    let created = 0;
    const createdAlerts: CreatedAlert[] = [];

    for (const candidate of candidates) {
      if (known.has(candidate.id)) {
        continue;
      }

      const url = ALERT_URLS[candidate.type];

      await prisma.alert.create({
        data: {
          userId,
          spaceId,
          type: candidate.type,
          severity: candidate.variant,
          fingerprint: candidate.id,
          title: candidate.title,
          description: candidate.description ?? null,
          data: { url },
          sentAt: now,
        },
      });

      createdAlerts.push({
        type: candidate.type,
        severity: candidate.variant,
        title: candidate.title,
        description: candidate.description ?? null,
        data: { url },
      });
      created += 1;
    }

    return { created, alerts: createdAlerts };
  },

  /**
   * Lists the user's alerts in the given space (unresolved first, then
   * newest) capped at 50, plus the count of unread alerts.
   */
  async listForUser(userId: string, spaceId: string) {
    const [alerts, unreadCount] = await Promise.all([
      prisma.alert.findMany({
        where: { userId, spaceId },
        orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
        take: 50,
      }),
      prisma.alert.count({
        where: { userId, spaceId, readAt: null, resolvedAt: null },
      }),
    ]);

    return { alerts, unreadCount };
  },

  /**
   * Marks alerts as read for the user in the given space: either the
   * provided ids or (when `all` is true) every unread alert.
   */
  async markAsRead(
    userId: string,
    spaceId: string,
    params: { ids?: string[]; all?: boolean },
  ) {
    const now = new Date();

    if (params.all) {
      await prisma.alert.updateMany({
        where: { userId, spaceId, readAt: null },
        data: { readAt: now },
      });
    } else if (params.ids?.length) {
      await prisma.alert.updateMany({
        where: { userId, spaceId, id: { in: params.ids } },
        data: { readAt: now },
      });
    }

    return { success: true };
  },

  /**
   * Deletes every alert for the user in the given space (read and unread).
   * Returns the number of alerts removed.
   */
  async clearAll(userId: string, spaceId: string): Promise<number> {
    const { count } = await prisma.alert.deleteMany({
      where: { userId, spaceId },
    });
    return count;
  },
};
