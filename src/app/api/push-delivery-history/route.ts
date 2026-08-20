import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { PushService } from "@/lib/services/push";

export const GET = withAuthenticatedRoute({
  routeName: "pushDeliveryHistory",
  fallbackMessage: "Could not load push delivery history",
  handler: async ({ auth }) => {
    const deliveries = await PushService.getDeliveryHistory(auth.id);
    return NextResponse.json({ deliveries });
  },
});

export const DELETE = withAuthenticatedRoute({
  routeName: "pushDeliveryHistory",
  fallbackMessage: "Could not clear push delivery history",
  handler: async ({ auth }) => {
    const result = await PushService.clearDeliveryHistory(auth.id);
    return NextResponse.json(result);
  },
});
