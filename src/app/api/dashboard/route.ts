import { NextResponse } from "next/server";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { DashboardService } from "@/lib/services/dashboard";

export const GET = withAuthenticatedRoute({
  routeName: "dashboard",
  fallbackMessage: "No se pudieron obtener los datos del dashboard",
  handler: async ({ auth, request }) => {
    const searchParams = new URL(request.url).searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const data = await DashboardService.getDashboard(
      auth.id,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );

    return NextResponse.json(data);
  },
});
