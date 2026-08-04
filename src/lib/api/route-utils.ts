import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/user";

const DOMAIN_ERROR_STATUS: Record<string, number> = {
  "Category not found": 404,
  "A category with this name already exists": 409,
  "Transaction not found": 404,
  "The category does not belong to the user": 400,
  "Budget not found": 404,
  "Goal not found": 404,
  "Comment not found": 404,
  "Parent comment not found": 404,
  "Profile not found": 404,
  "Space not found": 404,
  "Space name cannot be empty": 400,
  "You cannot edit this space": 403,
  "Unauthorized": 403,
};

export async function requireAuth(): Promise<User | NextResponse> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ message: "Authentication error" }, { status: 500 });
  }
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
        message: "Invalid data",
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
