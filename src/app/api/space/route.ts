import { NextResponse } from "next/server";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { SpaceService } from "@/lib/services/spaces/space-service";

export const GET = withAuthenticatedRoute({
  routeName: "space",
  fallbackMessage: "No se pudieron obtener los espacios",
  handler: async ({ auth }) => {
    const spaces = await SpaceService.listForUser(auth.id);
    return NextResponse.json(spaces);
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "space",
  fallbackMessage: "Could not process space",
  handler: async ({ auth, request }) => {
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
  },
});
