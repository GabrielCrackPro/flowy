import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { AlertsService } from "@/lib/services/alerts";
import { PushService } from "@/lib/services/push";

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
    let pushed = 0;

    for (const profile of profiles) {
      const result = await AlertsService.evaluateForUser(profile.id);
      created += result.created;

      if (result.alerts.length > 0) {
        const delivery = await PushService.sendAlertsToUser(
          profile.id,
          result.alerts,
        );
        pushed += delivery.sent;
      }
    }

    return NextResponse.json({ users: profiles.length, created, pushed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
