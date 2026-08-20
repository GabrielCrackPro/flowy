import { NextResponse } from "next/server";

import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { createCommentSchema } from "@/lib/schemas/comment";
import { CommentService } from "@/lib/services/comments";

export const GET = withAuthenticatedRoute({
  routeName: "comment",
  fallbackMessage: "No se pudieron obtener los comentarios",
  handler: async ({ auth, request }) => {
    const searchParams = new URL(request.url).searchParams;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { message: "entityType y entityId son requeridos" },
        { status: 400 },
      );
    }

    const comments = await CommentService.list(auth.id, entityType, entityId);
    return NextResponse.json(comments);
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "comment",
  fallbackMessage: "Could not create comment",
  handler: async ({ auth, request }) => {
    const body = createCommentSchema.parse(await request.json());
    const comment = await CommentService.create(auth.id, body);

    return NextResponse.json(comment, { status: 201 });
  },
});
