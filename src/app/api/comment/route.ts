import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { createCommentSchema } from "@/lib/schemas/comment";
import { CommentService } from "@/lib/services/comments";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const entityType = request.nextUrl.searchParams.get("entityType");
    const entityId = request.nextUrl.searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { message: "entityType y entityId son requeridos" },
        { status: 400 },
      );
    }

    const comments = await CommentService.list(auth.id, entityType, entityId);
    return NextResponse.json(comments);
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener los comentarios");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = createCommentSchema.parse(await request.json());
    const comment = await CommentService.create(auth.id, body);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Could not create comment");
  }
}
