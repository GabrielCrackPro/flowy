import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";
import {
  deleteAvatar,
  deleteReceipt,
  deleteSpaceAvatar,
} from "@/lib/services/storage";
import { createAdminClient } from "@/lib/supabase/admin";

export const DELETE = withAuthenticatedRoute({
  routeName: "account",
  fallbackMessage: "Could not delete account",
  handler: async ({ auth }) => {
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
    for (const spaceAvatarUrl of cleanup.spaceAvatarUrls) {
      cleanups.push(deleteSpaceAvatar(spaceAvatarUrl).catch(() => undefined));
    }
    await Promise.all(cleanups);

    return NextResponse.json({ message: "Account deleted" });
  },
});
