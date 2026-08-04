import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { createCategorySchema } from "@/lib/schemas";
import { CategoryService } from "@/lib/services/categories";

export async function GET() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "category");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const categories = await CategoryService.list(auth.id);

    const response = NextResponse.json(categories);
    return applyRateLimitHeaders(response, auth.id, "category");
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener las categorías");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "category");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = createCategorySchema.parse(await request.json());
    const category = await CategoryService.create(auth.id, body);

    const response = NextResponse.json(category, { status: 201 });
    return applyRateLimitHeaders(response, auth.id, "category");
  } catch (error) {
    return handleApiError(error, "Could not create category");
  }
}
