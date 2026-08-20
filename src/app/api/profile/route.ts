import { NextResponse } from "next/server";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";

export const POST = withAuthenticatedRoute({
  routeName: "profile",
  fallbackMessage: "Could not create profile",
  handler: async ({ auth }) => {
    const { profile, created } = await ProfileService.ensure(auth);

    return NextResponse.json(profile, {
      status: created ? 201 : 200,
    });
  },
});
