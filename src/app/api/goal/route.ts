import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { createGoalSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { GoalService } from "@/lib/services/goals";

export const GET = withAuthenticatedRoute({
  routeName: "goal",
  handler: async ({ auth, request, getContext }) => {
    const completed = new URL(request.url).searchParams.get("completed");
    return NextResponse.json(
      await GoalService.list(
        auth.id,
        { completed: completed === null ? undefined : completed === "true" },
        await getContext(),
      ),
    );
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "goal",
  handler: async ({ auth, request, getContext }) => {
    const goal = await GoalService.create(
      auth.id,
      createGoalSchema.parse(await request.json()),
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(goal, { status: 201 });
  },
});
