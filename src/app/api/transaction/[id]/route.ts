import { type NextRequest, NextResponse } from "next/server";

import {
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
} from "@/lib/api/route-utils";
import { updateTransactionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { TransactionService } from "@/lib/services/transactions";
import { ZodError } from "zod";

// Type guard for ZodError with proper type narrowing
function isZodError(error: unknown): error is ZodError<any> {
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

  try {
    const transaction = await TransactionService.get(auth.id, id);

    if (!transaction) {
      return NextResponse.json(
        { message: "Transacción no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    return handleApiError(error, "No se pudo obtener la transacción");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = updateTransactionSchema.parse(await request.json());
    const transaction = await TransactionService.update(auth.id, id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(transaction);
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json(
        { message: "Invalid transaction data", errors: (error as any).errors },
        { status: 400 },
      );
    }
    return handleApiError(error, "No se pudo actualizar la transacción");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    await TransactionService.delete(auth.id, id);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return noContent();
  } catch (error) {
    return handleApiError(error, "No se pudo eliminar la transacción");
  }
}
