import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { PushService } from "@/lib/services/push";

const testSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(160).optional(),
  subscriptionId: z.string().uuid().optional(),
});

/**
 * Sends a test push notification to the authenticated user's devices so they
 * can confirm push delivery works after enabling notifications.
 */
export const POST = withAuthenticatedRoute({
  routeName: "pushSubscription",
  fallbackMessage: "Failed to send test notification",
  handler: async ({ auth, request }) => {
    const body = await request.json().catch(() => null);
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const delivery = await PushService.sendTestToUser(
      auth.id,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        url: "/dashboard",
      },
      parsed.data.subscriptionId,
    );

    return NextResponse.json({ ok: true, sent: delivery.sent });
  },
});
