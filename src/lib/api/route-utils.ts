import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/user";
import {
  AppError,
  classifyError,
  RateLimitError,
  ValidationError,
} from "@/lib/errors/error-types";
import { prisma } from "@/lib/prisma/client";
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
  "Subscription not found": 404,
  "Space member not found": 404,
  "Space name cannot be empty": 400,
  "You cannot edit this space": 403,
  "You cannot remove yourself": 400,
  "Only the owner can remove members": 403,
  "User is not a member of this space": 404,
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

/**
 * Auth + admin guard for platform-level operations (e.g. managing status
 * incidents). Returns the authenticated user, or a 401/403 response.
 */
export async function requireAdmin(): Promise<User | NextResponse> {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;

  const profile = await prisma.profile.findUnique({
    where: { id: auth.id },
    select: { role: true },
  });
  if (profile?.role !== "admin") {
    return NextResponse.json(
      { message: "Administrator role required" },
      { status: 403 },
    );
  }
  return auth;
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const appError = new ValidationError(
      "Invalid data provided",
      Object.fromEntries(
        error.issues.map((issue) => [issue.path.join("."), issue.message]),
      ),
    );
    return NextResponse.json(
      {
        message: appError.message,
        category: appError.category,
        errors: error.issues,
      },
      { status: appError.statusCode },
    );
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    console.error(`[${error.category}] ${error.message}`, error.context);

    const response = NextResponse.json(error.toResponse(), {
      status: error.statusCode,
    });

    // Add rate limit headers for RateLimitError
    if (error instanceof RateLimitError) {
      const retryAfter = error.getRemainingTime();
      if (retryAfter > 0) {
        response.headers.set("Retry-After", retryAfter.toString());
      }
      if (error.retryAt) {
        response.headers.set("X-RateLimit-Reset", error.retryAt.toISOString());
      }
    }

    return response;
  }

  // Handle domain-specific errors with custom status codes
  if (error instanceof Error) {
    const status = DOMAIN_ERROR_STATUS[error.message];
    if (status) {
      const classifiedError = classifyError(error);
      console.error(`[${classifiedError.category}] ${error.message}`);
      return NextResponse.json(
        {
          message: error.message,
          category: classifiedError.category,
          isRetryable: classifiedError.isRetryable,
        },
        { status },
      );
    }
  }

  // Classify unknown errors
  const classifiedError = classifyError(error);
  console.error(`[${classifiedError.category}] ${fallbackMessage}`, error);

  return NextResponse.json(
    {
      message: fallbackMessage,
      category: classifiedError.category,
      isRetryable: classifiedError.isRetryable,
    },
    { status: classifiedError.statusCode },
  );
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
