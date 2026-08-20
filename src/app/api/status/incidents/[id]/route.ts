import { NextResponse } from "next/server";
import { z } from "zod";
import { noContent, withAdminRoute } from "@/lib/api/route-utils";
import { StatusService } from "@/lib/services/status";

const updateIncidentSchema = z.object({
  status: z.enum(["investigating", "monitoring", "resolved"]),
  message: z.string().max(2000).optional().nullable(),
});

interface Params {
  id: string;
}

/** Updates an incident's status and appends a timeline entry. */
export const PATCH = withAdminRoute<Params>({
  routeName: "statusIncident",
  fallbackMessage: "Could not update incident",
  handler: async ({ request, params }) => {
    const body = await request.json();
    const data = updateIncidentSchema.parse(body);
    const incident = await StatusService.updateIncident(params.id, data);
    return NextResponse.json({ incident });
  },
});

/** Publishes a draft incident so it appears on the public status page. */
export const POST = withAdminRoute<Params>({
  routeName: "statusIncident",
  fallbackMessage: "Could not publish incident",
  handler: async ({ params }) => {
    const incident = await StatusService.publishIncident(params.id);
    return NextResponse.json({ incident });
  },
});

/** Deletes an incident entirely (including its timeline). */
export const DELETE = withAdminRoute<Params>({
  routeName: "statusIncident",
  fallbackMessage: "Could not delete incident",
  handler: async ({ params }) => {
    await StatusService.deleteIncident(params.id);
    return noContent();
  },
});
