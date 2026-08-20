import { NextResponse } from "next/server";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { pushPreferencesSchema } from "@/lib/schemas/push-preferences";
import { ProfileService } from "@/lib/services/profiles";

export const GET = withAuthenticatedRoute({
  routeName: "push-preferences",
  fallbackMessage: "Could not load push preferences",
  handler: async ({ auth }) => {
    const { preferences } = await ProfileService.getPushPreferences(auth.id);
    return NextResponse.json({ preferences });
  },
});

export const PUT = withAuthenticatedRoute({
  routeName: "push-preferences",
  fallbackMessage: "Could not update push preferences",
  handler: async ({ auth, request }) => {
    const body = await request.json().catch(() => null);
    const parsed = pushPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid preferences", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await ProfileService.updatePushPreferences(
        auth.id,
        parsed.data.preferences,
      ),
    );
  },
});
