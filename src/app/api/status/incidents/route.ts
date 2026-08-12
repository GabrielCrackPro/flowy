import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAdmin,
  withRateLimit,
} from "@/lib/api/route-utils";
import { StatusService } from "@/lib/services/status";

const COMPONENT_IDS = ["api", "database", "auth", "push", "storage"] as const;

const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(2000).optional().nullable(),
  status: z.enum(["investigating", "monitoring"]).default("investigating"),
  severity: z.enum(["minor", "major", "critical"]).default("major"),
  component: z.enum(COMPONENT_IDS).optional().nullable(),
  type: z.enum(["incident", "maintenance"]).default("incident"),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
});

/**
 * Incident management for the status page. Admin-only (profile.role ===
 * "admin") — the status page itself stays public.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "statusIncident");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const incidents = await StatusService.listIncidents();
    const response = NextResponse.json({ incidents });
    return applyRateLimitHeaders(response, auth.id, "statusIncident");
  } catch (error) {
    return handleApiError(error, "Could not load incidents");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "statusIncident");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const data = createIncidentSchema.parse(body);
    const incident = await StatusService.createIncident(data);
    const response = NextResponse.json({ incident }, { status: 201 });
    return applyRateLimitHeaders(response, auth.id, "statusIncident");
  } catch (error) {
    return handleApiError(error, "Could not create incident");
  }
}
