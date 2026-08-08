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

    const candidates = buildDashboardAlerts(
      data,
      profile.locale,
      profile.currency,
      t,
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
};
