import { NextResponse } from "next/server";
import { noContent, withAuthenticatedRoute } from "@/lib/api/route-utils";
import { updateBudgetSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { BudgetService } from "@/lib/services/budgets";

interface Params {
  id: string;
}

export const GET = withAuthenticatedRoute<Params>({
  routeName: "budget",
  handler: async ({ auth, params, getContext }) => {
    const budget = await BudgetService.get(
      auth.id,
      params.id,
      await getContext(),
    );
    if (!budget) {
      return NextResponse.json(
        { message: "Budget not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(budget);
  },
});

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "budget",
  handler: async ({ auth, request, params, getContext }) => {
    const budget = await BudgetService.update(
      auth.id,
      params.id,
      updateBudgetSchema.parse(await request.json()),
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(budget);
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "budget",
  handler: async ({ auth, params, getContext }) => {
    await BudgetService.delete(auth.id, params.id, await getContext());
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return noContent();
  },
});
