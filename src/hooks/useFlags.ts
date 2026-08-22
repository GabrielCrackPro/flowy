"use client";

import { useContext } from "react";
import { type Flags, FlagsContext } from "@/context/FlagsProvider";

/** Safe fallback when no FlagsProvider is mounted — every flag is off. */
const DEFAULT_FLAGS: Flags = { oauthEnabled: false, assistantEnabled: false };

/**
 * Reads feature-flag values evaluated server-side. Returns the flags from
 * the nearest FlagsProvider, or all-off defaults outside one.
 */
export function useFlags(): Flags {
  return useContext(FlagsContext) ?? DEFAULT_FLAGS;
}
