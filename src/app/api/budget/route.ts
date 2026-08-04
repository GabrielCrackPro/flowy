import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { createBudgetSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { BudgetService } from "@/lib/services/budgets";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const categoryId = searchParams.get("categoryId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const budgets = await BudgetService.list(auth.id, {
      categoryId: categoryId ?? undefined,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
    });

    return NextResponse.json(budgets);
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener los presupuestos");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = createBudgetSchema.parse(await request.json());
    const budget = await BudgetService.create(auth.id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Could not create budget");
  }
}
