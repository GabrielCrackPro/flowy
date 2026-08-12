import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { PushService } from "@/lib/services/push";

const testSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(160).optional(),
});

/**
 * Sends a test push notification to the authenticated user's devices so they
 * can confirm push delivery works after enabling notifications.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const delivery = await PushService.sendTestToUser(auth.id, {
      title: parsed.data.title,
      description: parsed.data.description,
      url: "/dashboard",
    });

    return NextResponse.json({ ok: true, sent: delivery.sent });
  } catch (error) {
    return handleApiError(error, "Failed to send test notification");
  }
}
