"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";

const SERVICE_WORKER_PATH = "/sw.js";

/**
 * Registers the PWA service worker in production. Registration is
 * best-effort: if it fails (or is unsupported), the app keeps working.
 * When a new deploy ships a worker update, the user is prompted to apply it.
 */
export function ServiceWorkerRegister() {
  const { t } = useTranslation();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // In development, a service worker left over from a previous production
    // session on the same origin can keep serving stale cached chunks and
    // break dev (e.g. "module factory is not available"). Unregister it so
    // dev always runs with fresh modules.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
          if (registrations.length === 0) {
            return;
          }
          let keepWorker = false;
          try {
            keepWorker =
              sessionStorage.getItem("flowy-push-worker-enabled") === "true";
          } catch {
            // Storage may be unavailable in private browsing.
          }
          if (!keepWorker) {
            const subscriptions = await Promise.all(
              registrations.map((registration) =>
                registration.pushManager.getSubscription(),
              ),
            );
            keepWorker = subscriptions.some(Boolean);
          }
          if (keepWorker) {
            return;
          }
          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );
          // Unregistering does not immediately detach the current page from an
          // existing worker. Reload once so dev cannot keep using cached PWA
          // chunks from a previous production session.
          const cacheKeys = await caches.keys();
          await Promise.all(
            cacheKeys
              .filter((key) => key.startsWith("flowy-"))
              .map((key) => caches.delete(key)),
          );
          window.location.reload();
        });
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let updateToastId: string | number | undefined;
    let applyUpdate = false;

    // Refresh the service worker when the tab regains focus.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void registration?.update();
      }
    };

    // Reload once the new worker has actually taken control.
    const onControllerChange = () => {
      if (applyUpdate) {
        window.location.reload();
      }
    };

    const promptUpdate = (newWorker: ServiceWorker) => {
      // Skip the toast on the very first install (no previous controller).
      if (!navigator.serviceWorker.controller) {
        return;
      }
      updateToastId = toast.info(
        t("pwa.updateAvailable"),
        t("pwa.updateHint"),
        {
          duration: Infinity,
          action: (
            <Button
              size="sm"
              onClick={() => {
                applyUpdate = true;
                newWorker.postMessage("SKIP_WAITING");
                toast.dismiss(updateToastId);
              }}
            >
              {t("pwa.updateAction")}
            </Button>
          ),
        },
      );
    };

    const onUpdateFound = () => {
      const newWorker = registration?.installing;
      if (!newWorker) {
        return;
      }
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed") {
          promptUpdate(newWorker);
        }
      });
    };

    navigator.serviceWorker
      .register(SERVICE_WORKER_PATH, {
        scope: "/",
        updateViaCache: "none",
      })
      .then((swRegistration) => {
        registration = swRegistration;
        document.addEventListener("visibilitychange", onVisibilityChange);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          onControllerChange,
        );
        swRegistration.addEventListener("updatefound", onUpdateFound);
      })
      .catch(() => undefined);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      registration?.removeEventListener("updatefound", onUpdateFound);
    };
  }, [t]);

  return null;
}
