"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/shared/toast";
import { pushApi } from "@/lib/api/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SERVICE_WORKER_PATH = "/sw.js";
const KEEP_PUSH_WORKER_KEY = "flowy-push-worker-enabled";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64Url);
  const output = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }
  return output;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) {
    throw new Error("Push subscription key is missing");
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

interface PushState {
  supported: boolean;
  configured: boolean;
  checked: boolean;
  permission: NotificationPermission | null;
  subscribed: boolean;
  busy: boolean;
}

function getInitialState(): PushState {
  // supported starts false so the server and the client render the same HTML;
  // it is flipped to true after mount in the effect below. checked flips to
  // true once the support check has run, so the UI can tell "still checking"
  // from "definitely unavailable" without flashing a wrong state.
  return {
    supported: false,
    configured: Boolean(VAPID_PUBLIC_KEY),
    checked: false,
    permission: null,
    subscribed: false,
    busy: false,
  };
}

export function usePushNotifications() {
  const { t } = useTranslation();
  const [state, setState] = useState<PushState>(getInitialState);

  // Detect API support on the client only (avoids SSR hydration mismatches).
  useEffect(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window;
    setState((prev) => ({
      ...prev,
      checked: true,
      supported: isSupported,
      permission: isSupported ? Notification.permission : null,
    }));
  }, []);

  const refresh = useCallback(async () => {
    if (!state.supported) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setState((prev) => ({ ...prev, subscribed: false }));
        return;
      }
      const subscription = await registration.pushManager.getSubscription();
      // The toggle reflects the *stored* subscription: a browser subscription
      // without a matching DB row (e.g. an expired endpoint after the service
      // worker was unregistered) cannot receive pushes, so treat it as
      // disabled until it is re-registered.
      let stored = false;
      try {
        const result = await pushApi.status();
        stored = Boolean(result.subscribed);
      } catch {
        stored = false;
      }
      setState((prev) => ({
        ...prev,
        subscribed: Boolean(subscription) && stored,
        permission: Notification.permission,
      }));
    } catch {
      setState((prev) => ({ ...prev, subscribed: false }));
    }
  }, [state.supported]);

  useEffect(() => {
    void refresh();
    // Re-check when the tab regains focus (permission may change in settings).
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!state.supported || !state.configured) return;
    setState((prev) => ({ ...prev, busy: true }));
    try {
      // Development cleanup normally removes leftover service workers. Keep
      // it alive while push setup is in progress so it cannot race with the
      // subscription flow and force the user to subscribe again.
      sessionStorage.setItem(KEEP_PUSH_WORKER_KEY, "true");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((prev) => ({ ...prev, permission, busy: false }));
        return;
      }

      // The service worker must be registered before push can be subscribed.
      // Register it on demand when the page loaded before registration
      // finished (or the worker was unregistered, e.g. local development).
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: "/",
        });
        registration = await navigator.serviceWorker.ready;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY ?? ""),
        });
      }

      const installationType =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ))
          ? "pwa"
          : "browser";
      await pushApi.subscribe({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64Url(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64Url(subscription.getKey("auth")),
        installationType,
      });

      setState((prev) => ({
        ...prev,
        permission: "granted",
        subscribed: true,
      }));
    } catch (error) {
      try {
        sessionStorage.removeItem(KEEP_PUSH_WORKER_KEY);
      } catch {
        // Storage may be unavailable in private browsing.
      }
      console.error("Could not enable push notifications", error);
      toast.error(t("settings.notifications.enableError"));
    } finally {
      setState((prev) => ({ ...prev, busy: false }));
    }
  }, [state.supported, state.configured, t]);

  const disable = useCallback(async () => {
    if (!state.supported) return;
    setState((prev) => ({ ...prev, busy: true }));
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await pushApi.unsubscribe(subscription.endpoint).catch(() => undefined);
        await subscription.unsubscribe();
      }
      try {
        sessionStorage.removeItem(KEEP_PUSH_WORKER_KEY);
      } catch {
        // Storage may be unavailable in private browsing.
      }
      setState((prev) => ({ ...prev, subscribed: false }));
    } catch (error) {
      console.error("Could not disable push notifications", error);
    } finally {
      setState((prev) => ({ ...prev, busy: false }));
    }
  }, [state.supported]);

  return {
    supported: state.supported,
    configured: state.configured,
    checked: state.checked,
    permission: state.permission,
    subscribed: state.subscribed,
    busy: state.busy,
    enable,
    disable,
  };
}
