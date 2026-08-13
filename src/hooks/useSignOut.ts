"use client";

import { queryClient } from "@/lib/react-query";
import { signOut } from "@/lib/supabase/auth";

export type SignOutScope = "global" | "local" | "others";

/**
 * Signs out through Supabase and clears in-memory data even when the remote
 * sign-out request fails. Local sign-out is deliberately the default so a
 * network problem cannot leave a user stuck in an authenticated UI.
 */
export async function signOutAndClear(
  scope: SignOutScope = "local",
): Promise<Error | null> {
  let authError: Error | null = null;

  try {
    const { error } = await signOut(scope);
    if (error) {
      authError = error;
    }
  } catch (error) {
    authError = error instanceof Error ? error : new Error("Sign-out failed");
  } finally {
    // Cancel in-flight requests before wiping the in-memory cache so the
    // previous account's data never leaks into the next session on a shared
    // device. OfflineProvider purges persisted per-user data after the auth
    // state changes.
    queryClient.cancelQueries();
    queryClient.clear();
  }

  return authError;
}

export function useSignOut() {
  return async () => {
    await signOutAndClear("local");
    window.location.replace("/auth/login");
  };
}
