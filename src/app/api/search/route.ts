import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { SearchService } from "@/lib/services/search";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "search");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ query: q ?? "", results: [], total: 0 });
    }

    const results = await SearchService.search(auth.id, q);
    const response = NextResponse.json(results);
    return applyRateLimitHeaders(response, auth.id, "search");
  } catch (error) {
    return handleApiError(
      error,
      "No se pudieron obtener los resultados de búsqueda",
    );
  }
}
