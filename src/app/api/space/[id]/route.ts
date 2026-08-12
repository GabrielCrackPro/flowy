import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { SpaceService } from "@/lib/services/spaces/space-service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = await request.json();

    if (body?.action === "setActive") {
      const activeSpaceId = await SpaceService.setActive(auth.id, id);
      return NextResponse.json({ activeSpaceId });
    }

    if (body?.action === "rename") {
      const space = await SpaceService.update(
        auth.id,
        id,
        body.name,
        body.isPersonal,
        body.avatarUrl,
      );
      return NextResponse.json(space);
    }

    if (body?.action === "leave") {
      const result = await SpaceService.leave(auth.id, id);
      return NextResponse.json(result);
    }

    if (body?.action === "removeMember") {
      const result = await SpaceService.removeMember(
        auth.id,
        id,
        body.memberUserId,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { message: "Acción no soportada" },
      { status: 400 },
    );
  } catch (error) {
    return handleApiError(error, "Could not update space");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const result = await SpaceService.delete(auth.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Could not delete space");
  }
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const spaces = await SpaceService.listForUser(auth.id);
    const space = spaces.find((item) => item.id === id);

    if (!space) {
      return NextResponse.json({ message: "Space not found" }, { status: 404 });
    }

    return NextResponse.json(space);
  } catch (error) {
    return handleApiError(error, "Could not get space");
  }
}
