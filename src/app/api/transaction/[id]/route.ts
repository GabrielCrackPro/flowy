import { NextResponse } from "next/server";
import { noContent, withAuthenticatedRoute } from "@/lib/api/route-utils";
import { updateTransactionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { TransactionService } from "@/lib/services/transactions";

interface Params {
  id: string;
}

export const GET = withAuthenticatedRoute<Params>({
  routeName: "transaction",
  handler: async ({ auth, params, getContext }) => {
    const transaction = await TransactionService.get(
      auth.id,
      params.id,
      await getContext(),
    );
    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(transaction);
  },
});

export const PATCH = withAuthenticatedRoute<Params>({
  routeName: "transaction",
  handler: async ({ auth, request, params, getContext }) => {
    const body = updateTransactionSchema.parse(await request.json());
    const transaction = await TransactionService.update(
      auth.id,
      params.id,
      body,
      await getContext(),
    );
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return NextResponse.json(transaction);
  },
});

export const DELETE = withAuthenticatedRoute<Params>({
  routeName: "transaction",
  handler: async ({ auth, params, getContext }) => {
    await TransactionService.delete(auth.id, params.id, await getContext());
    await AlertsService.evaluateForUser(auth.id).catch(() => undefined);
    return noContent();
  },
});
