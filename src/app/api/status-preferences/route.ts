import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";

const COMPONENT_IDS = ["api", "database", "auth", "push", "storage"] as const;
const SEVERITIES = ["minor", "major", "critical"] as const;

const statusPreferencesSchema = z.object({
  enabled: z.boolean(),
  components: z.array(z.enum(COMPONENT_IDS)).max(COMPONENT_IDS.length),
  severities: z.array(z.enum(SEVERITIES)).max(SEVERITIES.length),
});

/** Per-user status alert preferences (master switch + components). */
export async function GET() {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: auth.id },
      select: {
        statusAlertsEnabled: true,
        statusAlertComponents: true,
        statusAlertSeverities: true,
      },
    });
    return NextResponse.json({
      enabled: profile?.statusAlertsEnabled ?? true,
      components: profile?.statusAlertComponents ?? [],
      severities: profile?.statusAlertSeverities ?? [],
    });
  } catch (error) {
    return handleApiError(error, "Could not load status preferences");
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "statusPreferences");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);
    const parsed = statusPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid preferences", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    await prisma.profile.update({
      where: { id: auth.id },
      data: {
        statusAlertsEnabled: parsed.data.enabled,
        statusAlertComponents: parsed.data.components,
        statusAlertSeverities: parsed.data.severities,
      },
    });

    const response = NextResponse.json({ ok: true, ...parsed.data });
    return applyRateLimitHeaders(response, auth.id, "statusPreferences");
  } catch (error) {
    return handleApiError(error, "Could not update status preferences");
  }
}
