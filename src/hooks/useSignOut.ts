"use client";

import { useRouter } from "next/navigation";
import { queryClient } from "@/lib/react-query";
import { signOut } from "@/lib/supabase";

export function useSignOut() {
  const router = useRouter();

  return async () => {
    await signOut();
    // Cancel in-flight requests before wiping the in-memory cache so the
    // previous account's data never leaks into the next session on a shared
    // device. (Persisted offline data is purged by the OfflineProvider when
    // it sees the user id go away.)
    queryClient.cancelQueries();
    queryClient.clear();
    router.replace("/auth/login");
    router.refresh();
  };
}
