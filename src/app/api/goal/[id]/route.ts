import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
} from "@/lib/api/route-utils";
import { updateGoalSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { GoalService } from "@/lib/services/goals";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const goal = await GoalService.get(auth.id, id);

    if (!goal) {
      return NextResponse.json(
        { message: "Objetivo no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    return handleApiError(error, "Could not get goal");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = updateGoalSchema.parse(await request.json());
    const goal = await GoalService.update(auth.id, id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(goal);
  } catch (error) {
    return handleApiError(error, "Could not update goal");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    await GoalService.delete(auth.id, id);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return noContent();
  } catch (error) {
    return handleApiError(error, "Could not delete goal");
  }
}
