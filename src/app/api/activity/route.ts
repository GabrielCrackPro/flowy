import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { ActivityService } from "@/lib/services/activities";

export const GET = withAuthenticatedRoute({
  routeName: "default",
  handler: async ({ auth, request, getContext }) => {
    const searchParams = new URL(request.url).searchParams;
    const requestedLimit = Number(searchParams.get("limit") ?? 15);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 15;
    return NextResponse.json(
      await ActivityService.list(
        auth.id,
        {
          limit,
          type: searchParams.get("type") ?? undefined,
          entityType: searchParams.get("entityType") ?? undefined,
          cursor: searchParams.get("cursor") ?? undefined,
        },
        await getContext(),
      ),
    );
  },
});

export const DELETE = withAuthenticatedRoute({
  routeName: "default",
  handler: async ({ auth }) =>
    NextResponse.json(await ActivityService.clearAll(auth.id)),
});
