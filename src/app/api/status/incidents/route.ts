import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdminRoute } from "@/lib/api/route-utils";
import { StatusService } from "@/lib/services/status";

const COMPONENT_IDS = ["api", "database", "auth", "push", "storage"] as const;

const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(2000).optional().nullable(),
  status: z.enum(["investigating", "monitoring"]).default("investigating"),
  severity: z.enum(["minor", "major", "critical"]).default("major"),
  component: z.enum(COMPONENT_IDS).optional().nullable(),
  type: z.enum(["incident", "maintenance"]).default("incident"),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
});

/**
 * Incident management for the status page. Admin-only (profile.role ===
 * "admin") — the status page itself stays public.
 */
export const GET = withAdminRoute({
  routeName: "statusIncident",
  fallbackMessage: "Could not load incidents",
  handler: async () => {
    const incidents = await StatusService.listIncidents();
    return NextResponse.json({ incidents });
  },
});

export const POST = withAdminRoute({
  routeName: "statusIncident",
  fallbackMessage: "Could not create incident",
  handler: async ({ request }) => {
    const body = await request.json();
    const data = createIncidentSchema.parse(body);
    const incident = await StatusService.createIncident(data);
    return NextResponse.json({ incident }, { status: 201 });
  },
});
