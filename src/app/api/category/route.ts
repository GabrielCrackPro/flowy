import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import { createCategorySchema } from "@/lib/schemas";
import { CategoryService } from "@/lib/services/categories";

export async function GET() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const categories = await CategoryService.list(auth.id);

    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener las categorías");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = createCategorySchema.parse(await request.json());
    const category = await CategoryService.create(auth.id, body);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Could not create category");
  }
}
