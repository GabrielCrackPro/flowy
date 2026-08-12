import { type NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api/route-utils";
import { StatusService } from "@/lib/services/status";

/**
 * Public status endpoint backing the GitHub-style status page.
 *
 * Runs the component checks live, persists them for uptime history, and
 * returns both the current snapshot and the aggregated per-day history.
 * Rate-limited per client IP (the status page polls it).
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rateLimitResponse = await withRateLimit(ip, "status");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const snapshot = await StatusService.checkAll();
    // Detect transitions before recording so alerts fire only on the first
    // check that observes a change (visitor polls and the cron share the
    // same deduplication against the last recorded state).
    const transitions = await StatusService.detectTransitions(snapshot);
    // Best-effort persistence — history accrues over time; a failed write
    // shouldn't take the status page down.
    await StatusService.record(snapshot).catch(() => {});
    await StatusService.notifyTransitions(transitions).catch(() => {});
    const [{ bars, uptime, lastFailure, latency }, incidents, maintenance] =
      await Promise.all([
        StatusService.history(),
        StatusService.listActiveIncidents(),
        StatusService.listMaintenance(),
      ]);

    return NextResponse.json({
      ...snapshot,
      history: bars,
      uptime,
      lastFailure,
      latency,
      incidents,
      maintenance,
    });
  } catch (error) {
    console.error("Status check failed:", error);
    return NextResponse.json(
      {
        status: "down",
        components: [],
        generatedAt: new Date().toISOString(),
        history: {},
        uptime: {},
        lastFailure: {},
        latency: {},
        incidents: [],
        maintenance: [],
      },
      { status: 503 },
    );
  }
}
