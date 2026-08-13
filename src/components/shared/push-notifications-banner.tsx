"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/shared/banner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell } from "@/lib/icons";

const DISMISS_KEY = "flowy-push-banner-dismissed";

/**
 * Slim strip under the header nudging users to enable push notifications.
 * Auto-hides once push is enabled (or permission is denied); can also be
 * dismissed for the current browser.
 */
export function PushNotificationsBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { checked, supported, configured, permission } = usePushNotifications({
    checkRemoteSubscription: false,
  });
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
          <Banner
            variant="strip"
            severity="info"
            icon={Bell}
            title={t("settings.notifications.bannerText")}
            actionLabel={t("settings.notifications.bannerAction")}
            onAction={() => router.push("/dashboard/profile#notifications")}
            onDismiss={dismiss}
            dismissLabel={t("common.close")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
