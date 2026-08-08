import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }

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
      },
      update: {
        userId: auth.id,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: userAgent?.slice(0, 300) ?? null,
      },
    });

    return NextResponse.json({ ok: true, id: subscription.id });
  } catch (error) {
    return handleApiError(error, "No se pudo guardar la suscripción");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = await request.json().catch(() => null);
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    if (!endpoint) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: auth.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "No se pudo eliminar la suscripción");
  }
}
