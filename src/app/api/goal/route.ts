import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { createGoalSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { GoalService } from "@/lib/services/goals";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "goal");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const completed = searchParams.get("completed");

    const goals = await GoalService.list(auth.id, {
      completed: completed === null ? undefined : completed === "true",
    });

    const response = NextResponse.json(goals);
    return applyRateLimitHeaders(response, auth.id, "goal");
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener los objetivos");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "goal");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = createGoalSchema.parse(await request.json());
    const goal = await GoalService.create(auth.id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    const response = NextResponse.json(goal, { status: 201 });
    return applyRateLimitHeaders(response, auth.id, "goal");
  } catch (error) {
    return handleApiError(error, "Could not create goal");
  }
}
