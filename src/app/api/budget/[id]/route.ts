import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
} from "@/lib/api/route-utils";
import { updateBudgetSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { BudgetService } from "@/lib/services/budgets";

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
    const budget = await BudgetService.get(auth.id, id);

    if (!budget) {
      return NextResponse.json(
        { message: "Budget not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(budget);
  } catch (error) {
    return handleApiError(error, "Could not get budget");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = updateBudgetSchema.parse(await request.json());
    const budget = await BudgetService.update(auth.id, id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(budget);
  } catch (error) {
    return handleApiError(error, "Could not update budget");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    await BudgetService.delete(auth.id, id);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return noContent();
  } catch (error) {
    return handleApiError(error, "Could not delete budget");
  }
}
