"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, X } from "@/lib/icons";

const DISMISS_KEY = "flowy-push-banner-dismissed";

/**
 * Slim strip under the header nudging users to enable push notifications.
 * Auto-hides once push is enabled (or permission is denied); can also be
 * dismissed for the current browser.
 */
export function PushNotificationsBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { checked, supported, configured, permission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Only nudge users who haven't decided yet: once permission was granted
  // (enabled) or denied (blocked), the banner stays away. The toggle card is
  // right below on the profile page — no banner needed there either.
  const visible =
    checked &&
    !dismissed &&
    pathname !== "/dashboard/profile" &&
    supported &&
    configured &&
    permission === "default";

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures (private mode etc.)
    }
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="border-b border-primary/20 bg-primary/5 px-4 py-2">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-2.5">
              <Bell aria-hidden className="size-4 shrink-0 text-primary" />
              <p className="min-w-0 flex-1 truncate text-sm text-foreground/80">
                {t("settings.notifications.bannerText")}
              </p>
              <Button asChild size="sm" className="shrink-0 rounded-lg">
                <Link href="/dashboard/profile#notifications">
                  {t("settings.notifications.bannerAction")}
                </Link>
              </Button>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t("common.close")}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
