import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  deviceName: z.string().trim().min(1).max(80).optional(),
  installationType: z.enum(["pwa", "browser"]).optional(),
});

const renameSchema = z.object({
  id: z.string().uuid(),
  deviceName: z.string().trim().min(1).max(80),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }
  const rateLimitResponse = await withRateLimit(auth.id, "pushSubscription");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: parsed.data.endpoint },
      select: { userId: true },
    });
    if (existing && existing.userId !== auth.id) {
      return NextResponse.json(
        { message: "La suscripción ya pertenece a otro usuario" },
        { status: 409 },
      );
    }

    const userAgent = request.headers.get("user-agent");
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        userId: auth.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: userAgent?.slice(0, 300) ?? null,
        deviceName: parsed.data.deviceName ?? null,
        installationType: parsed.data.installationType ?? null,
        lastSeenAt: new Date(),
      },
      update: {
        userId: auth.id,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: userAgent?.slice(0, 300) ?? null,
        ...(parsed.data.deviceName
          ? { deviceName: parsed.data.deviceName }
          : {}),
        ...(parsed.data.installationType
          ? { installationType: parsed.data.installationType }
          : {}),
        lastSeenAt: new Date(),
      },
    });

    const response = NextResponse.json({ ok: true, id: subscription.id });
    return applyRateLimitHeaders(response, auth.id, "pushSubscription");
  } catch (error) {
    return handleApiError(error, "Failed to save push subscription");
  }
}

export async function GET() {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }
  const rateLimitResponse = await withRateLimit(auth.id, "pushSubscription");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: auth.id },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        deviceName: true,
        installationType: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
        lastDeliveryAt: true,
        lastDeliveryStatus: true,
        failureCount: true,
        lastFailureReason: true,
      },
      orderBy: { createdAt: "asc" },
    });
    const response = NextResponse.json({
      ok: true,
      subscribed: subscriptions.length > 0,
      count: subscriptions.length,
      subscriptions,
    });
    return applyRateLimitHeaders(response, auth.id, "pushSubscription");
  } catch (error) {
    return handleApiError(error, "Failed to load push subscription status");
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;
  const rateLimitResponse = await withRateLimit(auth.id, "pushSubscription");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);
    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }
    const updated = await prisma.pushSubscription.updateMany({
      where: { id: parsed.data.id, userId: auth.id },
      data: { deviceName: parsed.data.deviceName },
    });
    if (updated.count === 0) {
      return NextResponse.json(
        { message: "Dispositivo no encontrado" },
        { status: 404 },
      );
    }
    const response = NextResponse.json({
      ok: true,
      deviceName: parsed.data.deviceName,
    });
    return applyRateLimitHeaders(response, auth.id, "pushSubscription");
  } catch (error) {
    return handleApiError(error, "Failed to rename push device");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }
  const rateLimitResponse = await withRateLimit(auth.id, "pushSubscription");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);
    if (body?.all === true) {
      await prisma.pushSubscription.deleteMany({
        where: { userId: auth.id },
      });
      const response = NextResponse.json({ ok: true });
      return applyRateLimitHeaders(response, auth.id, "pushSubscription");
    }

    if (body?.stale === true) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await prisma.pushSubscription.deleteMany({
        where: {
          userId: auth.id,
          OR: [
            { lastSeenAt: { lt: cutoff } },
            { lastSeenAt: null, updatedAt: { lt: cutoff } },
          ],
        },
      });
      const response = NextResponse.json({ ok: true, removed: result.count });
      return applyRateLimitHeaders(response, auth.id, "pushSubscription");
    }

    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    if (!endpoint) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: auth.id },
    });

    const response = NextResponse.json({ ok: true });
    return applyRateLimitHeaders(response, auth.id, "pushSubscription");
  } catch (error) {
    return handleApiError(error, "Failed to delete push subscription");
  }
}
