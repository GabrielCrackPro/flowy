import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { createGoalSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { GoalService } from "@/lib/services/goals";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const completed = searchParams.get("completed");

    const goals = await GoalService.list(auth.id, {
      completed: completed === null ? undefined : completed === "true",
    });

    return NextResponse.json(goals);
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener los objetivos");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = createGoalSchema.parse(await request.json());
    const goal = await GoalService.create(auth.id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return handleApiError(error, "No se pudo crear el objetivo");
  }
}
