import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@lib/api/route-utils";
import { ActivityService } from "@lib/services/activities";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
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
    return NextResponse.json(activities);
  } catch (error) {
    return handleApiError(error, "Could not get activity");
  }
}

export async function DELETE() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const result = await ActivityService.clearAll(auth.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Could not delete activity");
  }
}
