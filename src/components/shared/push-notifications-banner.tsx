"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/shared/banner";
import {
  BannerStripMotion,
  useBannerStackItem,
} from "@/components/shared/banner-stack";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell } from "@/lib/icons";

const DISMISS_KEY = "flowy-push-banner-dismissed";

/**
 * Slim strip under the header nudging users to enable push notifications.
 * The action enables push right from the banner (no navigation needed) and
 * shows a spinner while the browser permission flow is running. Auto-hides
 * once push is enabled (or permission is denied); can also be dismissed for
 * the current browser.
 */
export function PushNotificationsBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { checked, supported, configured, permission, busy, enable } =
    usePushNotifications({
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

  const { ownDismissHidden, staggerDelay } = useBannerStackItem({
    visible,
    onDismiss: dismiss,
  });

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <BannerStripMotion delay={staggerDelay}>
          <Banner
            variant="strip"
            severity="info"
            icon={Bell}
            title={t("settings.notifications.bannerText")}
            actionLabel={
              busy
                ? t("settings.notifications.bannerEnabling")
                : t("settings.notifications.bannerAction")
            }
            actionBusy={busy}
            onAction={() => void enable()}
            onDismiss={ownDismissHidden ? undefined : dismiss}
            dismissLabel={t("common.close")}
          />
        </BannerStripMotion>
      )}
    </AnimatePresence>
  );
}
