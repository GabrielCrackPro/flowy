"use client";

import { useProfileContext } from "@/context/ProfileContext";

export function useProfile() {
  return useProfileContext();
}
