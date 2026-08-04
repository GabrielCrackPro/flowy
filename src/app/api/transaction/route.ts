import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  requireAuth,
} from "@/lib/api/route-utils";
import {
  createTransactionSchema,
  paymentMethodSchema,
  transactionTypeSchema,
} from "@/lib/schemas";
import { TransactionService } from "@/lib/services/transactions";
import { AlertsService } from "@/lib/services/alerts";
import { ZodError } from "zod";

// Type guard for ZodError with proper type narrowing
function isZodError(error: unknown): error is ZodError<any> {
  return error instanceof ZodError;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const paymentMethod = searchParams.get("paymentMethod");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    const recurring = searchParams.get("isRecurring");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    // Validate query parameters
    const validatedPage = page ? parseInt(page, 10) : 1;
    const validatedLimit = limit ? parseInt(limit, 10) : 50;

    if (validatedPage < 1 || isNaN(validatedPage)) {
      return NextResponse.json(
        { message: "Invalid page number" },
        { status: 400 },
      );
    }

    if (validatedLimit < 1 || validatedLimit > 100 || isNaN(validatedLimit)) {
      return NextResponse.json(
        { message: "Invalid limit. Must be between 1 and 100" },
        { status: 400 },
      );
    }

    const transactions = await TransactionService.list(auth.id, {
      type: type ? transactionTypeSchema.parse(type) : undefined,
      categoryId: categoryId ?? undefined,
      paymentMethod: paymentMethod
        ? paymentMethodSchema.parse(paymentMethod)
        : undefined,
      from: from ?? undefined,
      to: to ?? undefined,
      search: search ?? undefined,
      isRecurring: recurring === null ? undefined : recurring === "true",
      page: validatedPage,
      limit: validatedLimit,
      sortBy: sortBy ?? undefined,
      sortOrder:
        sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json(
        { message: "Invalid query parameters", errors: (error as any).errors },
        { status: 400 },
      );
    }
    return handleApiError(error, "No se pudieron obtener las transacciones");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = await request.json();

    // Check if this is a bulk delete request
    if (body.action === "bulkDelete" && Array.isArray(body.ids)) {
      if (!body.ids || body.ids.length === 0) {
        return NextResponse.json(
          { message: "No transaction IDs provided" },
          { status: 400 },
        );
      }

      if (body.ids.length > 100) {
        return NextResponse.json(
          { message: "Cannot delete more than 100 transactions at once" },
          { status: 400 },
        );
      }

      const result = await TransactionService.bulkDelete(auth.id, body.ids);
      return NextResponse.json(result);
    }

    // Otherwise, it's a create transaction request
    const transaction = await TransactionService.create(
      auth.id,
      createTransactionSchema.parse(body),
    );

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json(
        { message: "Invalid transaction data", errors: (error as any).errors },
        { status: 400 },
      );
    }
    return handleApiError(error, "No se pudo procesar la solicitud");
  }
}
