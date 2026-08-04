import { NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";

export async function POST() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const { profile, created } = await ProfileService.ensure(auth);

    return NextResponse.json(profile, {
      status: created ? 201 : 200,
    });
  } catch (error) {
    return handleApiError(error, "No se pudo crear el perfil");
  }
}
