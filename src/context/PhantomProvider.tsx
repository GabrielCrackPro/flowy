"use client";

import { type ReactNode, useEffect } from "react";

let initialized = false;

interface PhantomProviderProps {
  children: ReactNode;
}

export function PhantomProvider({ children }: PhantomProviderProps) {
  useEffect(() => {
    if (initialized) return;

    initialized = true;

    void import("@aejkatappaja/phantom-ui");
  }, []);

  return <>{children}</>;
}
