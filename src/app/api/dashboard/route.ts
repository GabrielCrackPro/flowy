import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { DashboardService } from "@/lib/services/dashboard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
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

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(
      error,
      "No se pudieron obtener los datos del dashboard",
    );
  }
}
