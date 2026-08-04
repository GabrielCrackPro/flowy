import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { updateTransactionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { TransactionService } from "@/lib/services/transactions";
import { ZodError } from "zod";

// Type guard for ZodError with proper type narrowing
function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

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

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "transaction");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const transaction = await TransactionService.get(auth.id, id);

    if (!transaction) {
      return NextResponse.json(
        { message: "Transacción no encontrada" },
        { status: 404 },
      );
    }

    const response = NextResponse.json(transaction);
    return applyRateLimitHeaders(response, auth.id, "transaction");
  } catch (error) {
    return handleApiError(error, "Could not get transaction");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "transaction");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = updateTransactionSchema.parse(await request.json());
    const transaction = await TransactionService.update(auth.id, id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    const response = NextResponse.json(transaction);
    return applyRateLimitHeaders(response, auth.id, "transaction");
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json(
        { message: "Invalid transaction data", errors: error.issues },
        { status: 400 },
      );
    }
    return handleApiError(error, "Could not update transaction");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "transaction");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    await TransactionService.delete(auth.id, id);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    const response = noContent();
    return applyRateLimitHeaders(response, auth.id, "transaction");
  } catch (error) {
    return handleApiError(error, "Could not delete transaction");
  }
}
