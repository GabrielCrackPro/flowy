import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { StatsService } from "@/lib/services/stats";

export const GET = withAuthenticatedRoute({
  routeName: "stats",
  handler: async ({ auth, request }) => {
    const searchParams = new URL(request.url).searchParams;
    return NextResponse.json(
      await StatsService.getDashboardStats(
        auth.id,
        searchParams.has("month")
          ? Number(searchParams.get("month"))
          : undefined,
        searchParams.has("year") ? Number(searchParams.get("year")) : undefined,
      ),
    );
  },
});
