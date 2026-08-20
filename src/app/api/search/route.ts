import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { SearchService } from "@/lib/services/search";

export const GET = withAuthenticatedRoute({
  routeName: "search",
  handler: async ({ auth, request }) => {
    const q = new URL(request.url).searchParams.get("q");
    if (!q || q.length < 2) {
      return NextResponse.json({ query: q ?? "", results: [], total: 0 });
    }
    return NextResponse.json(
      await SearchService.search(
        auth.id,
        q,
        new URL(request.url).searchParams.get("cursor") ?? undefined,
      ),
    );
  },
});
