import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
} from "@/lib/api/route-utils";
import { updateProfileSchema, updateThemeSchema } from "@/lib/schemas/profile";
import { ProfileService } from "@/lib/services/profiles";
import { deleteAvatar } from "@/lib/services/storage";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const profile = await ProfileService.getById(auth.id, id);

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error, "Could not get profile");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = await request.json();

    // Validate with the appropriate schema based on what fields are present
    const hasColorFields =
      body.primaryColor !== undefined ||
      body.secondaryColor !== undefined ||
      body.accentColor !== undefined;

    const validatedBody = hasColorFields
      ? updateThemeSchema.parse(body)
      : updateProfileSchema.parse(body);

    const previous = await ProfileService.getById(auth.id, id);
    const profile = await ProfileService.update(auth.id, id, validatedBody);

    if (previous?.avatarUrl && previous.avatarUrl !== profile.avatarUrl) {
      await deleteAvatar(previous.avatarUrl);
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error, "Could not update profile");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    await ProfileService.delete(auth.id, id);

    return noContent();
  } catch (error) {
    return handleApiError(error, "Could not delete profile");
  }
}
