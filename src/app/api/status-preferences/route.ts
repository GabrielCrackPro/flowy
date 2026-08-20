import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";

const COMPONENT_IDS = ["api", "database", "auth", "push", "storage"] as const;
const SEVERITIES = ["minor", "major", "critical"] as const;

const statusPreferencesSchema = z.object({
  enabled: z.boolean(),
  components: z.array(z.enum(COMPONENT_IDS)).max(COMPONENT_IDS.length),
  severities: z.array(z.enum(SEVERITIES)).max(SEVERITIES.length),
});

/** Per-user status alert preferences (master switch + components). */
export const GET = withAuthenticatedRoute({
  routeName: "statusPreferences",
  fallbackMessage: "Could not load status preferences",
  handler: async ({ auth }) => {
    return NextResponse.json(
      await ProfileService.getStatusPreferences(auth.id),
    );
  },
});

export const PUT = withAuthenticatedRoute({
  routeName: "statusPreferences",
  fallbackMessage: "Could not update status preferences",
  handler: async ({ auth, request }) => {
    const body = await request.json().catch(() => null);
    const parsed = statusPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid preferences", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await ProfileService.updateStatusPreferences(auth.id, parsed.data),
    );
  },
});
