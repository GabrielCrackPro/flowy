import { type NextRequest, NextResponse } from "next/server";
import { StatusService } from "@/lib/services/status";

/**
 * Scheduled status checks. Runs the same component probes as /api/status and
 * persists them, so uptime history accrues even when nobody visits the page.
 * Triggered by the Vercel cron (see vercel.json) with CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await StatusService.checkAll();
    const transitions = await StatusService.detectTransitions(snapshot);
    await StatusService.record(snapshot);
    // Fire alerts only when a component actually changed status — comparing
    // against the last recorded check makes this naturally deduplicated
    // across cron runs.
    await StatusService.notifyTransitions(transitions);
    // When a component goes down, create a draft incident an admin can
    // publish with one click instead of typing it up mid-outage.
    const drafts = (
      await Promise.all(
        transitions.map((t) => StatusService.createAutoDraft(t)),
      )
    ).filter(Boolean).length;

    return NextResponse.json({
      overall: snapshot.overall,
      components: snapshot.components.map((c) => c.id),
      checkedAt: snapshot.generatedAt,
      transitions: transitions.length,
      drafts,
    });
  } catch (error) {
    console.error("Status cron failed:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
