"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase";

export function useSignOut() {
  const router = useRouter();

  return async () => {
    await signOut();
    router.replace("/auth/login");
    router.refresh();
  };
}
