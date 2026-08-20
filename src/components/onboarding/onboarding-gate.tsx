"use client";

import type { ReactNode } from "react";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { OnboardingWizard } from "./onboarding-wizard";

/**
 * Wraps dashboard children with the OnboardingProvider and renders
 * the OnboardingWizard overlay when needed. This is the integration
 * point between the server-rendered layout and the client-side wizard.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      {children}
      <OnboardingWizard />
    </OnboardingProvider>
  );
}
