import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { AlertsService } from "@/lib/services/alerts";

const readSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

export const POST = withAuthenticatedRoute({
  routeName: "default",
  handler: async ({ auth, request, getContext }) => {
    const context = await getContext();
    const body = readSchema.parse(await request.json());

    return NextResponse.json(
      await AlertsService.markAsRead(auth.id, context.spaceId, body),
    );
  },
});
