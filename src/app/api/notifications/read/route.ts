import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";
import { SpaceService } from "@/lib/services/spaces/space-service";

const readSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = readSchema.parse(await request.json());
    const activeSpace = await SpaceService.getCurrent(auth.id);
    const spaceId = activeSpace?.id ?? null;

    const now = new Date();

    if (body.all) {
      await prisma.alert.updateMany({
        where: { userId: auth.id, spaceId, readAt: null },
        data: { readAt: now },
      });
    } else if (body.ids?.length) {
      await prisma.alert.updateMany({
        where: { userId: auth.id, spaceId, id: { in: body.ids } },
        data: { readAt: now },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "No se pudieron marcar las notificaciones");
  }
}
