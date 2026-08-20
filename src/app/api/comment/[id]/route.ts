import { NextResponse } from "next/server";

import { noContent, withAuthenticatedRoute } from "@/lib/api/route-utils";
import { updateCommentSchema } from "@/lib/schemas/comment";
import { CommentService } from "@/lib/services/comments";

interface Params {
  id: string;
}

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "comment",
  fallbackMessage: "Could not update comment",
  handler: async ({ auth, request, params }) => {
    const body = updateCommentSchema.parse(await request.json());
    const comment = await CommentService.update(auth.id, params.id, body);

    return NextResponse.json(comment);
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "comment",
  fallbackMessage: "Could not delete comment",
  handler: async ({ auth, params }) => {
    await CommentService.delete(auth.id, params.id);
    return noContent();
  },
});
