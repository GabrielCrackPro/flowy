import { NextResponse } from "next/server";
import { noContent, withAuthenticatedRoute } from "@/lib/api/route-utils";
import { updateSubscriptionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { SubscriptionService } from "@/lib/services/subscriptions";

interface Params {
  id: string;
}

export const GET = withAuthenticatedRoute<Params>({
  routeName: "subscription",
  handler: async ({ auth, params, getContext }) => {
    const subscription = await SubscriptionService.get(
      auth.id,
      params.id,
      await getContext(),
    );
    if (!subscription) {
      return NextResponse.json(
        { message: "Subscription not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(subscription);
  },
});

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "subscription",
  handler: async ({ auth, request, params, getContext }) => {
    const subscription = await SubscriptionService.update(
      auth.id,
      params.id,
      updateSubscriptionSchema.parse(await request.json()),
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(subscription);
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "subscription",
  handler: async ({ auth, params, getContext }) => {
    await SubscriptionService.delete(auth.id, params.id, await getContext());
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return noContent();
  },
});
