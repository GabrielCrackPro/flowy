import { type NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api/route-utils";
import { type ComponentId, StatusService } from "@/lib/services/status";

const COMPONENT_IDS = ["api", "database", "auth", "push", "storage"] as const;

/**
 * Public per-component check history for the status page's component detail
 * view. Returns the recent individual checks (status + latency + time) that
 * power the latency chart and the failure list.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ component: string }> },
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rateLimitResponse = await withRateLimit(ip, "statusComponent");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { component } = await params;
    if (!COMPONENT_IDS.includes(component as (typeof COMPONENT_IDS)[number])) {
      return NextResponse.json(
        { message: "Unknown component" },
        { status: 400 },
      );
    }
    const checks = await StatusService.componentHistory(
      component as ComponentId,
    );
    return NextResponse.json({ component, checks });
  } catch (error) {
    console.error("Component history failed:", error);
    return NextResponse.json(
      { message: "Could not load component" },
      { status: 503 },
    );
  }
}
