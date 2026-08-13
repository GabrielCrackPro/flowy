import { NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";
import { deleteAvatar, deleteReceipt } from "@/lib/services/storage";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  const rateLimitResponse = await withRateLimit(auth.id, "account");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const cleanup = await ProfileService.deleteAccount(auth.id);

    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(auth.id);

    if (error) {
      // Do not expose GoTrue's provider error to the client. The profile was
      // intentionally retained so the user can retry without data loss.
      return NextResponse.json(
        { message: "Could not delete account" },
        { status: 502 },
      );
    }

    const cleanups: Promise<unknown>[] = [];
    if (cleanup.avatarUrl) {
      cleanups.push(deleteAvatar(cleanup.avatarUrl).catch(() => undefined));
    }
    for (const receiptUrl of cleanup.receiptUrls) {
      cleanups.push(deleteReceipt(receiptUrl).catch(() => undefined));
    }
    await Promise.all(cleanups);

    const response = NextResponse.json({ message: "Account deleted" });
    return applyRateLimitHeaders(response, auth.id, "account");
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Could not delete account" },
      { status: 500 },
    );
  }
}
