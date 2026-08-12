import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";
import { pushPreferencesSchema } from "@/lib/schemas/push-preferences";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: auth.id },
      select: { pushPreferences: true },
    });

    return NextResponse.json({ preferences: profile?.pushPreferences ?? [] });
  } catch (error) {
    return handleApiError(error, "Could not load push preferences");
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }

  const rateLimitResponse = await withRateLimit(auth.id, "push-preferences");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = pushPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid preferences", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    await prisma.profile.update({
      where: { id: auth.id },
      data: { pushPreferences: parsed.data.preferences },
    });

    const response = NextResponse.json({
      ok: true,
      preferences: parsed.data.preferences,
    });
    return applyRateLimitHeaders(response, auth.id, "push-preferences");
  } catch (error) {
    return handleApiError(error, "Could not update push preferences");
  }
}
