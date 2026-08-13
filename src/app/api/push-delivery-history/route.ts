import { NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "pushDeliveryHistory");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const deliveries = await prisma.pushDelivery.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        subscriptionId: true,
        type: true,
        component: true,
        severity: true,
        title: true,
        status: true,
        error: true,
        createdAt: true,
      },
    });
    const response = NextResponse.json({
      deliveries: deliveries.map((delivery) => ({
        ...delivery,
        createdAt: delivery.createdAt.toISOString(),
      })),
    });
    return applyRateLimitHeaders(response, auth.id, "pushDeliveryHistory");
  } catch (error) {
    return handleApiError(error, "Could not load push delivery history");
  }
}
