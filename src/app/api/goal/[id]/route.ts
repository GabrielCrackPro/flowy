import { NextResponse } from "next/server";
import { noContent, withAuthenticatedRoute } from "@/lib/api/route-utils";
import { updateGoalSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { GoalService } from "@/lib/services/goals";

interface Params {
  id: string;
}

export const GET = withAuthenticatedRoute<Params>({
  routeName: "goal",
  handler: async ({ auth, params, getContext }) => {
    const goal = await GoalService.get(auth.id, params.id, await getContext());
    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json(goal);
  },
});

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "goal",
  handler: async ({ auth, request, params, getContext }) => {
    const goal = await GoalService.update(
      auth.id,
      params.id,
      updateGoalSchema.parse(await request.json()),
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(goal);
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "goal",
  handler: async ({ auth, params, getContext }) => {
    await GoalService.delete(auth.id, params.id, await getContext());
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return noContent();
  },
});
