import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { PushService } from "@/lib/services/push";

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

export const POST = withAuthenticatedRoute({
  routeName: "pushSubscription",
  fallbackMessage: "Failed to save push subscription",
  handler: async ({ auth, request }) => {
    const body = await request.json().catch(() => null);
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent");
    const result = await PushService.saveSubscription(
      auth.id,
      parsed.data,
      userAgent,
    );
    if (result.conflict) {
      return NextResponse.json(
        { message: "La suscripción ya pertenece a otro usuario" },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, id: result.id });
  },
});

export const GET = withAuthenticatedRoute({
  routeName: "pushSubscription",
  fallbackMessage: "Failed to load push subscription status",
  handler: async ({ auth }) => {
    const subscriptions = await PushService.listSubscriptions(auth.id);
    return NextResponse.json({
      ok: true,
      subscribed: subscriptions.length > 0,
      count: subscriptions.length,
      subscriptions,
    });
  },
});

export const PATCH = withAuthenticatedRoute({
  routeName: "pushSubscription",
  fallbackMessage: "Failed to rename push device",
  handler: async ({ auth, request }) => {
    const body = await request.json().catch(() => null);
    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }
    const renamed = await PushService.renameSubscription(
      auth.id,
      parsed.data.id,
      parsed.data.deviceName,
    );
    if (!renamed) {
      return NextResponse.json(
        { message: "Dispositivo no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      deviceName: parsed.data.deviceName,
    });
  },
});

export const DELETE = withAuthenticatedRoute({
  routeName: "pushSubscription",
  fallbackMessage: "Failed to delete push subscription",
  handler: async ({ auth, request }) => {
    const body = await request.json().catch(() => null);
    if (body?.all === true) {
      await PushService.deleteSubscriptions(auth.id, { all: true });
      return NextResponse.json({ ok: true });
    }

    if (body?.stale === true) {
      const removed = await PushService.deleteSubscriptions(auth.id, {
        stale: true,
      });
      return NextResponse.json({ ok: true, removed });
    }

    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    if (!endpoint) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    await PushService.deleteSubscriptions(auth.id, { endpoint });
    return NextResponse.json({ ok: true });
  },
});
