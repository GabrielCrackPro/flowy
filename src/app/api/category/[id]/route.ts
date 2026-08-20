import { NextResponse } from "next/server";
import { noContent, withAuthenticatedRoute } from "@/lib/api/route-utils";
import { updateCategorySchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { CategoryService } from "@/lib/services/categories";

interface Params {
  id: string;
}

export const GET = withAuthenticatedRoute<Params>({
  routeName: "category",
  handler: async ({ auth, params, getContext }) => {
    const category = await CategoryService.getById(
      auth.id,
      params.id,
      await getContext(),
    );
    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(category);
  },
});

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "category",
  handler: async ({ auth, request, params, getContext }) => {
    const body = updateCategorySchema.parse(await request.json());
    const category = await CategoryService.update(
      auth.id,
      params.id,
      body,
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(category);
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "category",
  handler: async ({ auth, params, getContext }) => {
    await CategoryService.delete(auth.id, params.id, await getContext());
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return noContent();
  },
});
