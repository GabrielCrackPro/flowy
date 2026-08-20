"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isStandaloneDisplayMode,
  STANDALONE_MEDIA_QUERY,
} from "@/lib/breakpoints";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Named vibration patterns (ms). */
export type HapticPattern = "light" | "medium" | "heavy" | "success" | "toggle";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [10, 30, 10],
  toggle: 8,
};

export interface UsePwaReturn {
  /** Whether the app is running in standalone display mode (installed PWA). */
  isStandalone: boolean;
  /** Whether a `beforeinstallprompt` event has been captured and is ready. */
  canInstall: boolean;
  /** Whether the device is iOS (Safari can't prompt install). */
  isIos: boolean;
  /** Trigger the native install prompt. Returns `true` if the user accepted. */
  install: () => Promise<boolean>;
  /** Fire a haptic vibration pattern. No-op outside standalone mode or when unsupported. */
  vibrate: (pattern: HapticPattern) => void;
}

/**
 * Consolidated PWA hook.
 *
 * Provides everything PWA-related in one call:
 * - Standalone detection (reactive to display-mode changes)
 * - Install prompt capture + trigger
 * - iOS detection for manual "Add to Home Screen" guidance
 * - Haptic feedback (gated behind standalone + vibrate support)
 */
export function usePwa(): UsePwaReturn {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setStandalone(isStandaloneDisplayMode());
    setIos(isIos());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallEvent(null);
      setStandalone(true);
    };
    const onDisplayModeChange = (event: MediaQueryListEvent) => {
      setStandalone(event.matches);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    const mq = window.matchMedia(STANDALONE_MEDIA_QUERY);
    mq.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      mq.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") {
      setStandalone(true);
    }
    return choice.outcome === "accepted";
  }, [installEvent]);

  const vibrate = useCallback(
    (pattern: HapticPattern) => {
      if (!standalone) return;
      if (typeof navigator === "undefined" || !navigator.vibrate) return;
      navigator.vibrate(PATTERNS[pattern]);
    },
    [standalone],
  );

  return {
    isStandalone: standalone,
    canInstall: installEvent !== null,
    isIos: ios,
    install,
    vibrate,
  };
}
