import { NextResponse } from "next/server";
import { z } from "zod";

import { withAdminRoute } from "@/lib/api/route-utils";
import { prisma } from "@/lib/prisma/client";
import { ActivityService } from "@/lib/services/activities";
import { createAdminClient } from "@/lib/supabase/admin";

const demoteSchema = z.object({
  email: z.string().trim().email().max(255),
});

/**
 * Lists current admins (id, name, email, role). Admin-only; powers the
 * admin-management card in the status page admin panel.
 */
export const GET = withAdminRoute({
  routeName: "adminDemote",
  fallbackMessage: "Could not list admins",
  handler: async () => {
    const admins = await prisma.profile.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ admins });
  },
});

/**
 * Demotes a user from the admin role. Admin-only. Refuses to demote the LAST
 * admin — the app must always keep at least one administrator (the bootstrap
 * path is closed once an admin exists, so losing the last one would lock the
 * app out of admin features permanently).
 */
export const POST = withAdminRoute({
  routeName: "adminDemote",
  fallbackMessage: "Could not demote user",
  handler: async ({ auth, request }) => {
    const body = (await request.json()) as unknown;
    const { email } = demoteSchema.parse(body);

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

    if (profile.role !== "admin") {
      return NextResponse.json(
        { message: "User is not an admin" },
        { status: 409 },
      );
    }

    // Never demote the last admin — the app would lose all admin access.
    const adminCount = await prisma.profile.count({
      where: { role: "admin" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { message: "Cannot demote the last admin" },
        { status: 409 },
      );
    }

    await prisma.profile.update({
      where: { id: target.id },
      data: { role: "user" },
    });

    await ActivityService.record({
      userId: target.id,
      actorId: auth.id,
      type: "admin.demoted",
      entityType: "profile",
      entityId: target.id,
      metadata: {
        demotedBy: auth.id,
        email: target.email,
      },
      skipSpaceFilter: true,
    });

    return NextResponse.json({ message: "Admin role removed" });
  },
});
