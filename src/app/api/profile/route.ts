import { NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";

export async function POST() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "profile");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { profile, created } = await ProfileService.ensure(auth);

    const response = NextResponse.json(profile, {
      status: created ? 201 : 200,
    });
    return applyRateLimitHeaders(response, auth.id, "profile");
  } catch (error) {
    return handleApiError(error, "Could not create profile");
  }
}
