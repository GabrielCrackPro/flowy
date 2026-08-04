import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { SpaceService } from "@/lib/services/spaces/space-service";

export async function GET() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const spaces = await SpaceService.listForUser(auth.id);
    return NextResponse.json(spaces);
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener los espacios");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = await request.json();
    if (body?.action === "join") {
      const space = await SpaceService.join(auth.id, body.joinCode);
      return NextResponse.json(space, { status: 201 });
    }

    const space = await SpaceService.create(
      auth.id,
      body?.name || "Nuevo espacio",
      body?.isPersonal ?? false,
    );
    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Could not process space");
  }
}
