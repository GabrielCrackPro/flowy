import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { AlertsService } from "@/lib/services/alerts";

export const GET = withAuthenticatedRoute({
  routeName: "default",
  handler: async ({ auth, getContext }) => {
    const context = await getContext();
    const { alerts, unreadCount } = await AlertsService.listForUser(
      auth.id,
      context.spaceId,
    );
    return NextResponse.json({ alerts, unreadCount });
  },
});

export const DELETE = withAuthenticatedRoute({
  routeName: "default",
  handler: async ({ auth, getContext }) => {
    const context = await getContext();
    const deletedCount = await AlertsService.clearAll(auth.id, context.spaceId);
    return NextResponse.json({ deletedCount });
  },
});
