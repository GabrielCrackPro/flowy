"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
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
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      mq.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) {
      return false;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    // The captured prompt is single-use: hide the button regardless of the
    // outcome, and let the browser re-fire the event on a future visit.
    setInstallEvent(null);
    if (choice.outcome === "accepted") {
      setStandalone(true);
    }
    return choice.outcome === "accepted";
  }, [installEvent]);

  return {
    canInstall: installEvent !== null,
    ios,
    standalone,
    install,
  };
}
