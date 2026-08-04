import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { AlertsService } from "@/lib/services/alerts";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const profiles = await prisma.profile.findMany({
      select: { id: true },
    });

    let created = 0;

    for (const profile of profiles) {
      const result = await AlertsService.evaluateForUser(profile.id);
      created += result.created;
    }

    return NextResponse.json({ users: profiles.length, created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
