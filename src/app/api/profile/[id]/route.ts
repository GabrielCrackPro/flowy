import { NextResponse } from "next/server";

import { noContent, withAuthenticatedRoute } from "@/lib/api/route-utils";
import { updateProfileSchema, updateThemeSchema } from "@/lib/schemas/profile";
import { ProfileService } from "@/lib/services/profiles";
import { deleteAvatar } from "@/lib/services/storage";

interface Params {
  id: string;
}

export const GET = withAuthenticatedRoute<Params>({
  routeName: "profile",
  fallbackMessage: "Could not get profile",
  handler: async ({ auth, params }) => {
    const profile = await ProfileService.getById(auth.id, params.id);

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(profile);
  },
});

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "profile",
  fallbackMessage: "Could not update profile",
  handler: async ({ auth, request, params }) => {
    const body = await request.json();

    // Validate with the appropriate schema based on what fields are present
    const hasColorFields =
      body.primaryColor !== undefined ||
      body.secondaryColor !== undefined ||
      body.accentColor !== undefined;

    const validatedBody = hasColorFields
      ? updateThemeSchema.parse(body)
      : updateProfileSchema.parse(body);

    const previous = await ProfileService.getById(auth.id, params.id);
    const profile = await ProfileService.update(
      auth.id,
      params.id,
      validatedBody,
    );

    if (previous?.avatarUrl && previous.avatarUrl !== profile.avatarUrl) {
      await deleteAvatar(previous.avatarUrl);
    }

    return NextResponse.json(profile);
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "profile",
  fallbackMessage: "Could not delete profile",
  handler: async ({ auth, params }) => {
    await ProfileService.delete(auth.id, params.id);

    return noContent();
  },
});
