import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/user";

const DOMAIN_ERROR_STATUS: Record<string, number> = {
  "Categoría no encontrada": 404,
  "Ya existe una categoría con ese nombre.": 409,
  "Transacción no encontrada": 404,
  "La categoría no pertenece al usuario": 400,
  "Presupuesto no encontrado": 404,
  "Objetivo no encontrado": 404,
  "Comentario no encontrado": 404,
  "Comentario padre no encontrado": 404,
  "Perfil no encontrado": 404,
  "Espacio no encontrado": 404,
  "El nombre del espacio no puede estar vacío": 400,
  "No puedes editar este espacio": 403,
  "No autorizado": 403,
};

export async function requireAuth(): Promise<User | NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  return user;
}

export function isAuthResponse(
  result: User | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Datos inválidos",
        errors: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    const status = DOMAIN_ERROR_STATUS[error.message];

    if (status) {
      return NextResponse.json({ message: error.message }, { status });
    }
  }

  console.error(error);

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}
