import { type NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";
import type {
  ComponentId,
  ComponentStatus,
  IncidentRecord,
  OverallStatus,
} from "@/lib/services/status";

const COMPONENT_IDS = ["api", "database", "auth", "push", "storage"] as const;

const STATUS_RANK: Record<ComponentStatus, number> = {
  ok: 0,
  degraded: 1,
  down: 2,
};

/**
 * Lightweight public status summary for uptime monitors and the in-app
 * header dot. Unlike /api/status it does NOT run live probes — it returns
 * the last recorded checks, so it's cheap to poll frequently.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rateLimitResponse = await withRateLimit(ip, "statusSummary");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const rows = await prisma.serviceCheck.findMany({
      orderBy: { checkedAt: "desc" },
      take: COMPONENT_IDS.length * 2,
      select: { component: true, status: true, checkedAt: true },
    });

    const latest = new Map<
      ComponentId,
      { status: ComponentStatus; at: Date }
    >();
    for (const row of rows) {
      const id = row.component as ComponentId;
      if (!latest.has(id)) {
        latest.set(id, {
          status: row.status as ComponentStatus,
          at: row.checkedAt,
        });
      }
    }

    const components = COMPONENT_IDS.map((id) => {
      const entry = latest.get(id);
      return { id, status: entry?.status ?? ("down" as ComponentStatus) };
    });

    let overall: OverallStatus = "ok";
    for (const c of components) {
      if (STATUS_RANK[c.status] > STATUS_RANK[overall]) overall = c.status;
    }

    const activeIncidents = await prisma.incident.findMany({
      where: { status: { not: "resolved" }, type: "incident", draft: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const incidents: IncidentRecord[] = activeIncidents.map((i) => ({
      id: i.id,
      title: i.title,
      message: i.message,
      status: i.status as IncidentRecord["status"],
      severity: i.severity as IncidentRecord["severity"],
      type: "incident",
      component: i.component as ComponentId | null,
      draft: false,
      scheduledStart: null,
      scheduledEnd: null,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      updates: [],
    }));

    return NextResponse.json({
      overall,
      components,
      updatedAt: latest.size
        ? Math.max(...[...latest.values()].map((e) => e.at.getTime()))
        : null,
      hasIncidents: incidents.length > 0,
      incidents,
    });
  } catch (error) {
    console.error("Status summary failed:", error);
    return NextResponse.json(
      {
        overall: "down",
        components: COMPONENT_IDS.map((id) => ({
          id,
          status: "down" as const,
        })),
        updatedAt: null,
        hasIncidents: false,
        incidents: [],
      },
      { status: 503 },
    );
  }
}
