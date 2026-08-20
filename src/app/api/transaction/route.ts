import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import {
  createTransactionSchema,
  paymentMethodSchema,
  transactionTypeSchema,
} from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { TransactionService } from "@/lib/services/transactions";

export const GET = withAuthenticatedRoute({
  routeName: "transaction",
  handler: async ({ auth, request, getContext }) => {
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get("type");
    const paymentMethod = searchParams.get("paymentMethod");
    const paymentMethods = paymentMethod
      ? paymentMethod
          .split(",")
          .filter(Boolean)
          .map((method) => paymentMethodSchema.parse(method))
      : [];
    const page = searchParams.get("page")
      ? Number(searchParams.get("page"))
      : 1;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 50;

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json(
        { message: "Invalid page number" },
        { status: 400 },
      );
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { message: "Invalid limit. Must be between 1 and 100" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await TransactionService.list(
        auth.id,
        {
          type: type ? transactionTypeSchema.parse(type) : undefined,
          categoryId: searchParams.get("categoryId") ?? undefined,
          paymentMethod:
            paymentMethods.length > 1 ? paymentMethods : paymentMethods[0],
          from: searchParams.get("from") ?? undefined,
          to: searchParams.get("to") ?? undefined,
          search: searchParams.get("search") ?? undefined,
          isRecurring:
            searchParams.get("isRecurring") === null
              ? undefined
              : searchParams.get("isRecurring") === "true",
          page,
          limit,
          cursor: searchParams.get("cursor") ?? undefined,
          sortBy: searchParams.get("sortBy") ?? undefined,
          sortOrder:
            searchParams.get("sortOrder") === "asc" ||
            searchParams.get("sortOrder") === "desc"
              ? (searchParams.get("sortOrder") as "asc" | "desc")
              : undefined,
        },
        await getContext(),
      ),
    );
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "transaction",
  handler: async ({ auth, request, getContext }) => {
    const context = await getContext();
    const body = await request.json();

    if (body.action === "bulkDelete" && Array.isArray(body.ids)) {
      if (body.ids.length === 0 || body.ids.length > 100) {
        return NextResponse.json(
          { message: "Provide between 1 and 100 transaction IDs" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        await TransactionService.bulkDelete(auth.id, body.ids, context),
      );
    }

    const transaction = await TransactionService.create(
      auth.id,
      createTransactionSchema.parse(body),
      context,
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(transaction, { status: 201 });
  },
});
