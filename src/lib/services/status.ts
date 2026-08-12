import { prisma } from "@/lib/prisma/client";
import { PushService } from "@/lib/services/push";
import { createAdminClient } from "@/lib/supabase/admin";

export type ComponentId = "api" | "database" | "auth" | "push" | "storage";

export type ComponentStatus = "ok" | "degraded" | "down";

export type IncidentStatus = "investigating" | "monitoring" | "resolved";

export type IncidentType = "incident" | "maintenance";

export type IncidentSeverity = "minor" | "major" | "critical";

export interface ComponentCheck {
  id: ComponentId;
  status: ComponentStatus;
  latencyMs: number;
  detail?: string;
}

export type OverallStatus = "ok" | "degraded" | "down";

const COMPONENT_IDS: ComponentId[] = [
  "api",
  "database",
  "auth",
  "push",
  "storage",
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const STATUS_PAGE_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://flowy-jade.vercel.app"}/status`;

// How far back the status page shows uptime bars.
const HISTORY_DAYS = 90;

const STATUS_RANK: Record<ComponentStatus, number> = {
  ok: 0,
  degraded: 1,
  down: 2,
};

function rankStatus(status: ComponentStatus): number {
  return STATUS_RANK[status];
}

function worstOf(statuses: ComponentStatus[]): ComponentStatus {
  let worst: ComponentStatus = "ok";
  for (const status of statuses) {
    if (rankStatus(status) > rankStatus(worst)) {
      worst = status;
    }
  }
  return worst;
}

/** Runs a probe with a timeout; returns null if it never resolves. */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function measure<T>(fn: () => Promise<T>): Promise<{
  value: T | null;
  latencyMs: number;
}> {
  const start = performance.now();
  const value = await fn();
  return { value, latencyMs: Math.round(performance.now() - start) };
}

async function checkApi(): Promise<ComponentCheck> {
  // The route responding is itself the API check.
  return { id: "api", status: "ok", latencyMs: 0 };
}

async function checkDatabase(): Promise<ComponentCheck> {
  const { value, latencyMs } = await measure(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });
  return {
    id: "database",
    status: value === null ? "down" : "ok",
    latencyMs,
  };
}

async function checkAuth(): Promise<ComponentCheck> {
  const { value, latencyMs } = await measure(async () => {
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL not configured");
    // The auth health endpoint requires the apikey header and answers 200
    // with the GoTrue version/name (no is_healthy field), so a 2xx is the
    // signal that auth is up.
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  });
  return {
    id: "auth",
    status: value === true ? "ok" : value === null ? "down" : "degraded",
    latencyMs,
  };
}

async function checkPush(): Promise<ComponentCheck> {
  // Push is a config-level check: are VAPID keys wired up? We can't send a
  // real push to a device from the status page, so treat a valid client as
  // operational and missing keys as degraded.
  const start = performance.now();
  const hasClient = PushService.isConfigured();
  const latencyMs = Math.round(performance.now() - start);
  return {
    id: "push",
    status: hasClient ? "ok" : "degraded",
    latencyMs,
    detail: hasClient ? undefined : "VAPID keys not configured",
  };
}

async function checkStorage(): Promise<ComponentCheck> {
  const { value, latencyMs } = await measure(async () => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return false;
    }
    const admin = createAdminClient();
    const { data, error } = await admin.storage.listBuckets();
    if (error) throw error;
    return data.length > 0;
  });
  return {
    id: "storage",
    status: value === true ? "ok" : "degraded",
    latencyMs,
  };
}

async function runCheck(component: ComponentId): Promise<ComponentCheck> {
  switch (component) {
    case "api":
      return checkApi();
    case "database":
      return checkDatabase();
    case "auth":
      return checkAuth();
    case "push":
      return checkPush();
    case "storage":
      return checkStorage();
  }
}

export interface StatusSnapshot {
  overall: OverallStatus;
  components: ComponentCheck[];
  generatedAt: string;
}

export interface UptimeBar {
  /** ISO date (yyyy-mm-dd, UTC). */
  date: string;
  /** Worst status that day, or null when no checks ran that day. */
  status: ComponentStatus | null;
}

/**
 * Uptime as an ok/total check ratio over the history window, per component.
 * Unlike the daily bars (which show the *worst* status of a day), this is a
 * fair share of successful checks — a single blip doesn't zero out a day.
 */
export type UptimePercentages = Record<ComponentId, number | null>;

export interface StatusHistory {
  bars: Record<ComponentId, UptimeBar[]>;
  uptime: UptimePercentages;
  /** ISO timestamp of the most recent non-ok check per component (or null). */
  lastFailure: Record<ComponentId, string | null>;
  /** Recent check latencies per component (ms), newest first, for sparklines. */
  latency: Record<ComponentId, number[]>;
}

export interface IncidentTimelineEntry {
  id: string;
  status: IncidentStatus;
  message: string | null;
  createdAt: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  message: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  type: IncidentType;
  component: ComponentId | null;
  draft: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  updates: IncidentTimelineEntry[];
}

export interface ComponentCheckRecord {
  checkedAt: string;
  status: ComponentStatus;
  latencyMs: number | null;
}

export interface IncidentInput {
  title: string;
  message?: string | null;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  type?: IncidentType;
  component?: ComponentId | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
}

export interface IncidentUpdateInput {
  status: IncidentStatus;
  message?: string | null;
}

export type TransitionKind = "degraded" | "down" | "recovered";

export interface ComponentTransition {
  component: ComponentId;
  from: ComponentStatus;
  to: ComponentStatus;
  kind: TransitionKind;
  latencyMs: number;
  detail?: string;
}

function rankToKind(
  from: ComponentStatus,
  to: ComponentStatus,
): TransitionKind {
  if (to === "down") return "down";
  if (to === "degraded" && from === "ok") return "degraded";
  if (to === "ok" && from !== "ok") return "recovered";
  return "degraded";
}

export const StatusService = {
  /**
   * Runs every component check with per-check timeouts and returns the
   * snapshot. Never throws — a failing component reports `down`.
   */
  async checkAll(): Promise<StatusSnapshot> {
    const results = await Promise.all(
      COMPONENT_IDS.map(async (id) => {
        const checked = await withTimeout(runCheck(id), 8000);
        return checked ?? { id, status: "down" as const, latencyMs: 8000 };
      }),
    );
    return {
      overall: worstOf(results.map((r) => r.status)),
      components: results,
      generatedAt: new Date().toISOString(),
    };
  },

  /** Persists a snapshot as ServiceCheck rows. */
  async record(snapshot: StatusSnapshot): Promise<void> {
    await prisma.serviceCheck.createMany({
      data: snapshot.components.map((c) => ({
        component: c.id,
        status: c.status,
        latencyMs: c.latencyMs,
        detail: c.detail,
      })),
    });
  },

  /**
   * Compares a fresh snapshot against the last recorded checks and returns
   * the components whose status changed. Used by the cron to fire alerts
   * only on real transitions (not on every poll).
   */
  async detectTransitions(
    snapshot: StatusSnapshot,
  ): Promise<ComponentTransition[]> {
    const lastRows = await prisma.serviceCheck.findMany({
      orderBy: { checkedAt: "desc" },
      take: COMPONENT_IDS.length * 2,
      select: { component: true, status: true },
    });
    // Map component -> most recent recorded status.
    const last = new Map<ComponentId, ComponentStatus>();
    for (const row of lastRows) {
      const id = row.component as ComponentId;
      if (!last.has(id)) last.set(id, row.status as ComponentStatus);
    }

    const transitions: ComponentTransition[] = [];
    for (const check of snapshot.components) {
      const previous = last.get(check.id);
      if (!previous || previous === check.status) continue;
      transitions.push({
        component: check.id,
        from: previous,
        to: check.status,
        kind: rankToKind(previous, check.status),
        latencyMs: check.latencyMs,
        detail: check.detail,
      });
    }
    return transitions;
  },

  /**
   * Fires status-change alerts (push) for the given transitions.
   * Best-effort: a failed push never fails the status check.
   */
  async notifyTransitions(transitions: ComponentTransition[]): Promise<void> {
    if (transitions.length === 0) return;
    try {
      await notifyPush(transitions);
    } catch (error) {
      console.error("Status alert failed:", error);
    }
  },

  /** Active (unresolved) incidents, newest first, with their timelines. */
  async listActiveIncidents(): Promise<IncidentRecord[]> {
    const incidents = await prisma.incident.findMany({
      where: { status: { not: "resolved" }, type: "incident", draft: false },
      include: {
        updates: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return incidents.map(toIncidentRecord);
  },

  /**
   * Unresolved maintenance windows (past or future) for the status page
   * countdown section, soonest upcoming first.
   */
  async listMaintenance(): Promise<IncidentRecord[]> {
    const incidents = await prisma.incident.findMany({
      where: { status: { not: "resolved" }, type: "maintenance", draft: false },
      include: {
        updates: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { scheduledStart: "asc" },
      take: 10,
    });
    return incidents.map(toIncidentRecord);
  },

  /** All incidents for the admin UI, newest first. */
  async listIncidents(): Promise<IncidentRecord[]> {
    const incidents = await prisma.incident.findMany({
      include: {
        updates: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return incidents.map(toIncidentRecord);
  },

  async createIncident(input: IncidentInput): Promise<IncidentRecord> {
    const status = input.status ?? "investigating";
    const type = input.type ?? "incident";
    const incident = await prisma.incident.create({
      data: {
        title: input.title,
        message: input.message ?? null,
        status,
        severity: input.severity ?? "major",
        type,
        component: input.component ?? null,
        scheduledStart: input.scheduledStart
          ? new Date(input.scheduledStart)
          : null,
        scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
        updates: {
          create: { status, message: input.message ?? null },
        },
      },
      include: { updates: { orderBy: { createdAt: "asc" } } },
    });
    return toIncidentRecord(incident);
  },

  async deleteIncident(id: string): Promise<void> {
    await prisma.incident.deleteMany({ where: { id } });
  },

  async updateIncident(
    id: string,
    input: IncidentUpdateInput,
  ): Promise<IncidentRecord> {
    const resolvedAt = input.status === "resolved" ? new Date() : null;
    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: input.status,
        message: input.message ?? null,
        resolvedAt,
        updates: {
          create: { status: input.status, message: input.message ?? null },
        },
      },
      include: { updates: { orderBy: { createdAt: "asc" } } },
    });
    return toIncidentRecord(incident);
  },

  /** Publishes a draft incident so it shows on the public status page. */
  async publishIncident(id: string): Promise<IncidentRecord> {
    const incident = await prisma.incident.update({
      where: { id },
      data: { draft: false },
      include: { updates: { orderBy: { createdAt: "asc" } } },
    });
    return toIncidentRecord(incident);
  },

  /**
   * Auto-creates a draft "Investigating" incident for a component that just
   * went down, so an admin can publish it with one click instead of typing
   * it up mid-outage. Deduplicated: no new draft while an unresolved draft
   * for the same component already exists.
   */
  async createAutoDraft(transition: ComponentTransition): Promise<boolean> {
    if (transition.kind !== "down") return false;
    const existing = await prisma.incident.findFirst({
      where: {
        type: "incident",
        component: transition.component,
        draft: true,
        status: { not: "resolved" },
      },
      select: { id: true },
    });
    if (existing) return false;

    const name = componentLabel(transition.component);
    await prisma.incident.create({
      data: {
        title: `${name} is down (auto-detected)`,
        message: `Flowy detected that ${name} stopped responding. Investigate and publish this incident to notify users.`,
        status: "investigating",
        severity: "critical",
        type: "incident",
        component: transition.component,
        draft: true,
        updates: {
          create: {
            status: "investigating",
            message: "Auto-detected: component not responding.",
          },
        },
      },
    });
    return true;
  },

  /**
   * Aggregates check history into per-day bars (UTC) for the last
   * HISTORY_DAYS days, worst-status-per-day per component, plus an honest
   * ok/total uptime percentage per component over the same window.
   */

  /**
   * Aggregates check history into per-day bars (UTC) for the last
   * HISTORY_DAYS days, worst-status-per-day per component, plus an honest
   * ok/total uptime percentage per component over the same window.
   */
  async history(days = HISTORY_DAYS): Promise<StatusHistory> {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const rows = await prisma.serviceCheck.findMany({
      where: { checkedAt: { gte: since } },
      select: {
        component: true,
        status: true,
        latencyMs: true,
        checkedAt: true,
      },
      orderBy: { checkedAt: "asc" },
    });

    // Day -> component -> worst status, plus per-component ok/total counts.
    const byDay = new Map<string, Map<ComponentId, ComponentStatus>>();
    const counts = new Map<ComponentId, { ok: number; total: number }>();
    for (const row of rows) {
      const component = row.component as ComponentId;
      const day = row.checkedAt.toISOString().slice(0, 10);
      const dayMap = byDay.get(day) ?? new Map<ComponentId, ComponentStatus>();
      const status = row.status as ComponentStatus;
      const existing = dayMap.get(component);
      if (!existing || rankStatus(status) > rankStatus(existing)) {
        dayMap.set(component, status);
      }
      byDay.set(day, dayMap);

      const entry = counts.get(component) ?? { ok: 0, total: 0 };
      entry.total += 1;
      if (status === "ok") entry.ok += 1;
      counts.set(component, entry);
    }

    const bars = {} as Record<ComponentId, UptimeBar[]>;
    const uptime = {} as UptimePercentages;
    const lastFailure = {} as Record<ComponentId, string | null>;
    // Recent latencies per component (newest first) for the inline sparkline.
    const latency = {} as Record<ComponentId, number[]>;
    for (const component of COMPONENT_IDS) {
      const componentBars: UptimeBar[] = [];
      const cursor = new Date(since);
      for (let i = 0; i < days; i++) {
        const date = cursor.toISOString().slice(0, 10);
        componentBars.push({
          date,
          status: byDay.get(date)?.get(component) ?? null,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      bars[component] = componentBars;

      const count = counts.get(component);
      uptime[component] =
        count && count.total > 0
          ? Math.round((count.ok / count.total) * 1000) / 10
          : null;

      // Most recent non-ok check within the window.
      const failureRow = [...rows]
        .reverse()
        .find(
          (row) =>
            row.component === component &&
            (row.status === "degraded" || row.status === "down"),
        );
      lastFailure[component] = failureRow
        ? failureRow.checkedAt.toISOString()
        : null;

      // Last 24 recorded latencies, oldest first so the line reads left→right.
      latency[component] = rows
        .filter((row) => row.component === component && row.latencyMs != null)
        .slice(-24)
        .map((row) => row.latencyMs as number);
    }
    return { bars, uptime, lastFailure, latency };
  },

  /**
   * Recent individual checks for one component (newest first), for the
   * component detail view's latency chart and failure list.
   */
  async componentHistory(
    component: ComponentId,
    limit = 200,
  ): Promise<ComponentCheckRecord[]> {
    const rows = await prisma.serviceCheck.findMany({
      where: { component },
      select: { checkedAt: true, status: true, latencyMs: true },
      orderBy: { checkedAt: "desc" },
      take: limit,
    });
    return rows
      .map((row) => ({
        checkedAt: row.checkedAt.toISOString(),
        status: row.status as ComponentStatus,
        latencyMs: row.latencyMs,
      }))
      .reverse(); // oldest first, so the chart reads left→right
  },
};

function toIncidentRecord(incident: {
  id: string;
  title: string;
  message: string | null;
  status: string;
  severity: string;
  type: string;
  component: string | null;
  draft: boolean;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  updates: Array<{
    id: string;
    status: string;
    message: string | null;
    createdAt: Date;
  }>;
}): IncidentRecord {
  return {
    id: incident.id,
    title: incident.title,
    message: incident.message,
    status: incident.status as IncidentStatus,
    severity: incident.severity as IncidentSeverity,
    type: incident.type as IncidentType,
    component: incident.component as ComponentId | null,
    draft: incident.draft,
    scheduledStart: incident.scheduledStart?.toISOString() ?? null,
    scheduledEnd: incident.scheduledEnd?.toISOString() ?? null,
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    updates: incident.updates.map((u) => ({
      id: u.id,
      status: u.status as IncidentStatus,
      message: u.message,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

function componentLabel(component: ComponentId): string {
  const labels: Record<ComponentId, string> = {
    api: "API",
    database: "Database",
    auth: "Authentication",
    push: "Push notifications",
    storage: "Storage",
  };
  return labels[component];
}

function transitionTitle(transition: ComponentTransition): string {
  const name = componentLabel(transition.component);
  switch (transition.kind) {
    case "down":
      return `🔴 Flowy: ${name} is down`;
    case "degraded":
      return `🟡 Flowy: ${name} is degraded`;
    case "recovered":
      return `🟢 Flowy: ${name} recovered`;
  }
}

async function notifyPush(transitions: ComponentTransition[]): Promise<void> {
  if (transitions.length === 0) return;
  if (!PushService.isConfigured()) return;
  await PushService.broadcast(
    transitions.map((t) => ({
      title: transitionTitle(t),
      description: t.detail,
      url: STATUS_PAGE_URL,
      tag: `flowy-status-${t.component}`,
      component: t.component,
    })),
  );
}
