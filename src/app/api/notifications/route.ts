import { NextResponse } from "next/server";
import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";
import { SpaceService } from "@/lib/services/spaces/space-service";

export async function GET() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const activeSpace = await SpaceService.getCurrent(auth.id);
    const spaceId = activeSpace?.id ?? null;

    const [alerts, unreadCount] = await Promise.all([
      prisma.alert.findMany({
        where: { userId: auth.id, spaceId },
        orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
        take: 50,
      }),
      prisma.alert.count({
        where: { userId: auth.id, spaceId, readAt: null, resolvedAt: null },
      }),
    ]);

    return NextResponse.json({ alerts, unreadCount });
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener las notificaciones");
  }
}
