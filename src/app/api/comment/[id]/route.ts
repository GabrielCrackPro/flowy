import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
} from "@/lib/api/route-utils";
import { updateCommentSchema } from "@/lib/schemas/comment";
import { CommentService } from "@/lib/services/comments";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = updateCommentSchema.parse(await request.json());
    const comment = await CommentService.update(auth.id, id, body);

    return NextResponse.json(comment);
  } catch (error) {
    return handleApiError(error, "No se pudo actualizar el comentario");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    await CommentService.delete(auth.id, id);
    return noContent();
  } catch (error) {
    return handleApiError(error, "No se pudo eliminar el comentario");
  }
}
