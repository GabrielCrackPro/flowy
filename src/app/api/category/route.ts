import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { createCategorySchema } from "@/lib/schemas";
import { CategoryService } from "@/lib/services/categories";

export const GET = withAuthenticatedRoute({
  routeName: "category",
  handler: async ({ auth, getContext }) =>
    NextResponse.json(await CategoryService.list(auth.id, await getContext())),
});

export const POST = withAuthenticatedRoute({
  routeName: "category",
  handler: async ({ auth, request, getContext }) => {
    const body = createCategorySchema.parse(await request.json());
    return NextResponse.json(
      await CategoryService.create(auth.id, body, await getContext()),
      { status: 201 },
    );
  },
});
