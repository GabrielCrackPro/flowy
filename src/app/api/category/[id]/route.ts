import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
} from "@/lib/api/route-utils";
import { updateCategorySchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { CategoryService } from "@/lib/services/categories";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const category = await CategoryService.getById(auth.id, id);

    if (!category) {
      return NextResponse.json(
        { message: "Categoría no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error, "Could not get category");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = updateCategorySchema.parse(await request.json());
    const category = await CategoryService.update(auth.id, id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error, "Could not update category");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    await CategoryService.delete(auth.id, id);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return noContent();
  } catch (error) {
    return handleApiError(error, "Could not delete category");
  }
}
