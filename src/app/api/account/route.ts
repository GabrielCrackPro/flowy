import { NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "account");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    await ProfileService.deleteAccount(auth.id);

    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(auth.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const response = NextResponse.json({ message: "Cuenta eliminada" });
    return applyRateLimitHeaders(response, auth.id, "account");
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Could not delete account" },
      { status: 500 },
    );
  }
}
