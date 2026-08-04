import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { DashboardService } from "@/lib/services/dashboard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "dashboard");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const data = await DashboardService.getDashboard(
      auth.id,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );

    const response = NextResponse.json(data);
    return applyRateLimitHeaders(response, auth.id, "dashboard");
  } catch (error) {
    return handleApiError(
      error,
      "No se pudieron obtener los datos del dashboard",
    );
  }
}
