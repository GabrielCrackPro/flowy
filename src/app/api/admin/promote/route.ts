import { NextResponse } from "next/server";
import { z } from "zod";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAdmin,
  withRateLimit,
} from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";
import { ActivityService } from "@/lib/services/activities";
import { createAdminClient } from "@/lib/supabase/admin";

const promoteSchema = z.object({
  email: z.string().trim().email().max(255),
});

/**
 * Promotes a user (by auth email) to the admin role. Admin-only — only an
 * existing admin can call this, and the UI for it renders only for admins.
 * Records an audit activity so promotions are traceable.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) {
    return auth;
  }

  const rateLimitResponse = await withRateLimit(auth.id, "adminPromote");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = (await request.json()) as unknown;
    const { email } = promoteSchema.parse(body);

    const supabase = createAdminClient();
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      throw new Error("Could not look up user");
    }

    const target = users.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!target) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: target.id },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 },
      );
    }

    if (profile.role === "admin") {
      return NextResponse.json(
        { message: "User is already an admin" },
        { status: 409 },
      );
    }

    await prisma.profile.update({
      where: { id: target.id },
      data: { role: "admin" },
    });

    await ActivityService.record({
      userId: target.id,
      actorId: auth.id,
      type: "admin.promoted",
      entityType: "profile",
      entityId: target.id,
      metadata: {
        promotedBy: auth.id,
        email: target.email,
      },
      skipSpaceFilter: true,
    });

    const response = NextResponse.json({ message: "User promoted to admin" });
    return applyRateLimitHeaders(response, auth.id, "adminPromote");
  } catch (error) {
    return handleApiError(error, "Could not promote user");
  }
}
