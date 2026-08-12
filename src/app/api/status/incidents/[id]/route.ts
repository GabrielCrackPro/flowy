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

const updateIncidentSchema = z.object({
  status: z.enum(["investigating", "monitoring", "resolved"]),
  message: z.string().max(2000).optional().nullable(),
});

/** Updates an incident's status and appends a timeline entry. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "statusIncident");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateIncidentSchema.parse(body);
    const incident = await StatusService.updateIncident(id, data);
    const response = NextResponse.json({ incident });
    return applyRateLimitHeaders(response, auth.id, "statusIncident");
  } catch (error) {
    return handleApiError(error, "Could not update incident");
  }
}

/** Publishes a draft incident so it appears on the public status page. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "statusIncident");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const incident = await StatusService.publishIncident(id);
    const response = NextResponse.json({ incident });
    return applyRateLimitHeaders(response, auth.id, "statusIncident");
  } catch (error) {
    return handleApiError(error, "Could not publish incident");
  }
}

/** Deletes an incident entirely (including its timeline). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "statusIncident");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    await StatusService.deleteIncident(id);
    const response = new NextResponse(null, { status: 204 });
    return applyRateLimitHeaders(response, auth.id, "statusIncident");
  } catch (error) {
    return handleApiError(error, "Could not delete incident");
  }
}
