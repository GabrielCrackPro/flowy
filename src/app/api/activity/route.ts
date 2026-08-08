import { type NextRequest, NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { ActivityService } from "@/lib/services/activities";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting (using default rate limit for activity feed)
  const rateLimitResponse = await withRateLimit(auth.id, "default");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = Number(searchParams.get("limit") ?? 15);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 15;
    const type = searchParams.get("type") ?? undefined;
    const entityType = searchParams.get("entityType") ?? undefined;

    const activities = await ActivityService.list(auth.id, {
      limit,
      type,
      entityType,
    });
    const response = NextResponse.json(activities);
    return applyRateLimitHeaders(response, auth.id, "default");
  } catch (error) {
    return handleApiError(error, "Could not get activity");
  }
}

export async function DELETE() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting (using default rate limit for activity feed)
  const rateLimitResponse = await withRateLimit(auth.id, "default");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const result = await ActivityService.clearAll(auth.id);
    const response = NextResponse.json(result);
    return applyRateLimitHeaders(response, auth.id, "default");
  } catch (error) {
    return handleApiError(error, "Could not delete activity");
  }
}
