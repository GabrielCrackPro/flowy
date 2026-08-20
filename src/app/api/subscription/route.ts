import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { billingCycleSchema, createSubscriptionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { SubscriptionService } from "@/lib/services/subscriptions";

export const GET = withAuthenticatedRoute({
  routeName: "subscription",
  handler: async ({ auth, request, getContext }) => {
    const searchParams = new URL(request.url).searchParams;
    const billingCycle = searchParams.get("billingCycle");
    return NextResponse.json(
      await SubscriptionService.list(
        auth.id,
        {
          active:
            searchParams.get("active") === null
              ? undefined
              : searchParams.get("active") === "true",
          billingCycle: billingCycle
            ? billingCycleSchema.parse(billingCycle)
            : undefined,
        },
        await getContext(),
      ),
    );
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "subscription",
  handler: async ({ auth, request, getContext }) => {
    const subscription = await SubscriptionService.create(
      auth.id,
      createSubscriptionSchema.parse(await request.json()),
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(subscription, { status: 201 });
  },
});
