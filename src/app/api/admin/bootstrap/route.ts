import { NextResponse } from "next/server";
import { z } from "zod";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";
import { ActivityService } from "@/lib/services/activities";

const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET ?? "";

const bootstrapSchema = z.object({
  secret: z.string().min(1).max(255),
});

async function hasAnyAdmin(): Promise<boolean> {
  const admin = await prisma.profile.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });
  return admin !== null;
}

/**
 * First-admin bootstrap: lets the owner claim the admin role when NO admin
 * exists yet, using a server-side secret (ADMIN_BOOTSTRAP_SECRET). Once an
 * admin exists, this endpoint refuses to promote anyone — all future
 * promotions go through the admin-only /api/admin/promote route.
 *
 * GET  → whether the bootstrap card should be shown (secret configured AND
 *        no admin exists).
 * POST → promote the authenticated caller to admin if the secret matches and
 *        no admin exists yet.
 */
export async function GET() {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }

  const hasAdmin = await hasAnyAdmin();
  return NextResponse.json({
    enabled: Boolean(bootstrapSecret) && !hasAdmin,
    hasAdmin,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) {
    return auth;
  }

  const rateLimitResponse = await withRateLimit(auth.id, "adminBootstrap");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    if (!bootstrapSecret) {
      return NextResponse.json(
        { message: "Bootstrap not configured" },
        { status: 403 },
      );
    }

    if (await hasAnyAdmin()) {
      // An admin already exists — the bootstrap path is closed for good.
      return NextResponse.json(
        { message: "Administrator already exists" },
        { status: 409 },
      );
    }

    const body = (await request.json()) as unknown;
    const { secret } = bootstrapSchema.parse(body);

    if (secret !== bootstrapSecret) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 403 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: auth.id },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 },
      );
    }

    if (profile.role === "admin") {
      return NextResponse.json({ message: "Already an admin" });
    }

    await prisma.profile.update({
      where: { id: auth.id },
      data: { role: "admin" },
    });

    await ActivityService.record({
      userId: auth.id,
      actorId: auth.id,
      type: "admin.bootstrap",
      entityType: "profile",
      entityId: auth.id,
      metadata: {
        method: "bootstrap",
      },
      skipSpaceFilter: true,
    });

    const response = NextResponse.json({
      message: "You are now an admin",
      role: "admin",
    });
    return applyRateLimitHeaders(response, auth.id, "adminBootstrap");
  } catch (error) {
    return handleApiError(error, "Could not claim admin access");
  }
}
