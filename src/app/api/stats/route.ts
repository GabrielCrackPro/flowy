import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { StatsService } from "@/lib/services/stats";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "stats");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const stats = await StatsService.getDashboardStats(
      auth.id,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );

    const response = NextResponse.json(stats);
    return applyRateLimitHeaders(response, auth.id, "stats");
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener las estadísticas");
  }
}
