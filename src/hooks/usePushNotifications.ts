"use client";

import { useCallback, useEffect, useState } from "react";

import { pushApi } from "@/lib/api/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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
  permission: NotificationPermission | null;
  subscribed: boolean;
  busy: boolean;
}

function getInitialState(): PushState {
  // supported starts false so the server and the client render the same HTML;
  // it is flipped to true after mount in the effect below.
  return {
    supported: false,
    configured: Boolean(VAPID_PUBLIC_KEY),
    permission: null,
    subscribed: false,
    busy: false,
  };
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>(getInitialState);

  // Detect API support on the client only (avoids SSR hydration mismatches).
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }
    setState((prev) => ({
      ...prev,
      supported: true,
      permission: Notification.permission,
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
      setState((prev) => ({
        ...prev,
        subscribed: Boolean(subscription),
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
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((prev) => ({ ...prev, permission, busy: false }));
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error("Service worker not registered");
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY ?? ""),
        });
      }

      await pushApi.subscribe({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64Url(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64Url(subscription.getKey("auth")),
      });

      setState((prev) => ({
        ...prev,
        permission: "granted",
        subscribed: true,
      }));
    } catch (error) {
      console.error("Could not enable push notifications", error);
    } finally {
      setState((prev) => ({ ...prev, busy: false }));
    }
  }, [state.supported, state.configured]);

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
    permission: state.permission,
    subscribed: state.subscribed,
    busy: state.busy,
    enable,
    disable,
  };
}
