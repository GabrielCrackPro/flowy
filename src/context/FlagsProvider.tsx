"use client";

import { createContext, type ReactNode } from "react";

export interface Flags {
  oauthEnabled: boolean;
  assistantEnabled: boolean;
}

export const FlagsContext = createContext<Flags | null>(null);

/**
 * Provides feature-flag values to client components. Values are evaluated
 * server-side (see src/lib/flags.ts) and passed in as props — the provider
 * itself never reads them from the client.
 */
export function FlagsProvider({
  flags,
  children,
}: {
  flags: Flags;
  children: ReactNode;
}) {
  return (
    <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
  );
}
