import { NextResponse } from "next/server";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { SpaceService } from "@/lib/services/spaces/space-service";

interface Params {
  id: string;
}

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "space",
  fallbackMessage: "Could not update space",
  handler: async ({ auth, request, params }) => {
    const body = await request.json();

    if (body?.action === "setActive") {
      const activeSpaceId = await SpaceService.setActive(auth.id, params.id);
      return NextResponse.json({ activeSpaceId });
    }

    if (body?.action === "rename") {
      const space = await SpaceService.update(
        auth.id,
        params.id,
        body.name,
        body.isPersonal,
        body.avatarUrl,
      );
      return NextResponse.json(space);
    }

    if (body?.action === "leave") {
      const result = await SpaceService.leave(auth.id, params.id);
      return NextResponse.json(result);
    }

    if (body?.action === "removeMember") {
      const result = await SpaceService.removeMember(
        auth.id,
        params.id,
        body.memberUserId,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { message: "Acción no soportada" },
      { status: 400 },
    );
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "space",
  fallbackMessage: "Could not delete space",
  handler: async ({ auth, params }) => {
    const result = await SpaceService.delete(auth.id, params.id);
    return NextResponse.json(result);
  },
});

export const GET = withAuthenticatedRoute<Params>({
  routeName: "space",
  fallbackMessage: "Could not get space",
  handler: async ({ auth, params }) => {
    const spaces = await SpaceService.listForUser(auth.id);
    const space = spaces.find((item) => item.id === params.id);

    if (!space) {
      return NextResponse.json({ message: "Space not found" }, { status: 404 });
    }

    return NextResponse.json(space);
  },
});
