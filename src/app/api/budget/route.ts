import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { createBudgetSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { BudgetService } from "@/lib/services/budgets";

export const GET = withAuthenticatedRoute({
  routeName: "budget",
  handler: async ({ auth, request, getContext }) => {
    const searchParams = new URL(request.url).searchParams;
    return NextResponse.json(
      await BudgetService.list(
        auth.id,
        {
          categoryId: searchParams.get("categoryId") ?? undefined,
          month: searchParams.has("month")
            ? Number(searchParams.get("month"))
            : undefined,
          year: searchParams.has("year")
            ? Number(searchParams.get("year"))
            : undefined,
        },
        await getContext(),
      ),
    );
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "budget",
  handler: async ({ auth, request, getContext }) => {
    const budget = await BudgetService.create(
      auth.id,
      createBudgetSchema.parse(await request.json()),
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(budget, { status: 201 });
  },
});
