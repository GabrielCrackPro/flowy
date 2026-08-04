import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/user";
import {
  addRateLimitHeaders,
  checkRateLimit,
  createRateLimitResponse,
  getRateLimitConfig,
  getRateLimitStatus,
  RATE_LIMIT_ENABLED,
} from "@/lib/rate-limit";

const DOMAIN_ERROR_STATUS: Record<string, number> = {
  "Category not found": 404,
  "A category with this name already exists": 409,
  "Transaction not found": 404,
  "The category does not belong to the user": 400,
  "Budget not found": 404,
  "Goal not found": 404,
  "Comment not found": 404,
  "Parent comment not found": 404,
  "Profile not found": 404,
  "Space not found": 404,
  "Space name cannot be empty": 400,
  "You cannot edit this space": 403,
  Unauthorized: 403,
};

export async function requireAuth(): Promise<User | NextResponse> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { message: "Authentication error" },
      { status: 500 },
    );
  }
}

export function isAuthResponse(
  result: User | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Invalid data",
        errors: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    const status = DOMAIN_ERROR_STATUS[error.message];

    if (status) {
      return NextResponse.json({ message: error.message }, { status });
    }
  }

  console.error(error);

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Rate limiting wrapper for API routes
 * @param identifier - Unique identifier for rate limiting (e.g., user ID or IP)
 * @param routeName - Route name to get rate limit config
 * @returns Response if rate limited, null if allowed
 */
export async function withRateLimit(
  identifier: string,
  routeName: string,
): Promise<NextResponse | null> {
  // Skip rate limiting if disabled
  if (!RATE_LIMIT_ENABLED) {
    return null;
  }

  const config = getRateLimitConfig(routeName);
  const result = checkRateLimit(identifier, config);

  if (!result.success) {
    return createRateLimitResponse(result.remaining, result.resetTime);
  }

  return null;
}

/**
 * Apply rate limit headers to successful responses
 * @param response - The response to add headers to
 * @param identifier - Unique identifier for rate limiting
 * @param routeName - Route name to get rate limit config
 * @returns Response with rate limit headers
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  identifier: string,
  routeName: string,
): NextResponse {
  // Skip rate limit headers if disabled
  if (!RATE_LIMIT_ENABLED) {
    return response;
  }

  const config = getRateLimitConfig(routeName);
  const result = getRateLimitStatus(identifier, config);

  return addRateLimitHeaders(
    response,
    result.remaining,
    result.resetTime,
    config.requests,
  );
}
