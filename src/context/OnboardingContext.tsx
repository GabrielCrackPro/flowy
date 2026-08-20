"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useProfile } from "@/hooks/useProfile";

const STORAGE_KEY = "flowy-onboarding-completed";

interface OnboardingContextValue {
  /** True while the provider is still determining whether onboarding is needed. */
  loading: boolean;
  /** True when onboarding has NOT been completed (wizard should be shown). */
  needsOnboarding: boolean;
  /** Mark onboarding as complete: persists to both localStorage and the profile DB field. */
  completeOnboarding: () => Promise<void>;
  /** Dismiss without persisting to DB (user skipped — localStorage only). */
  dismissOnboarding: () => void;
  /** Reset onboarding state so the wizard can be replayed. */
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

function readLocalStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { profile, update, loading: profileLoading } = useProfile();
  const [localDone, setLocalDone] = useState(readLocalStorage);

  // Sync from profile when it loads (handles new-device scenario).
  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.onboardingCompletedAt && !localDone) {
      writeLocalStorage();
      setLocalDone(true);
    }
  }, [profile, profileLoading, localDone]);

  const needsOnboarding = !profileLoading && !localDone;

  const completeOnboarding = useCallback(async () => {
    writeLocalStorage();
    setLocalDone(true);
    try {
      await update({
        onboardingCompletedAt: new Date().toISOString(),
      });
    } catch {
      // Best-effort — localStorage is already set so the wizard won't reappear.
    }
  }, [update]);

  const dismissOnboarding = useCallback(() => {
    writeLocalStorage();
    setLocalDone(true);
    // Persist to DB so the wizard doesn't reappear on other devices either.
    void update({
      onboardingCompletedAt: new Date().toISOString(),
    }).catch(() => undefined);
  }, [update]);

  const resetOnboarding = useCallback(async () => {
    clearLocalStorage();
    try {
      await update({ onboardingCompletedAt: null });
    } catch {
      // Best-effort — localStorage is already cleared so the wizard will
      // appear on next page load.
    }
    // Set localDone AFTER the DB update so the sync effect doesn't see a
    // stale profile.onboardingCompletedAt and immediately re-close.
    setLocalDone(false);
  }, [update]);

  const value = useMemo(
    () => ({
      loading: profileLoading,
      needsOnboarding,
      completeOnboarding,
      dismissOnboarding,
      resetOnboarding,
    }),
    [
      profileLoading,
      needsOnboarding,
      completeOnboarding,
      dismissOnboarding,
      resetOnboarding,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
