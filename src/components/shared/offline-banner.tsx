"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useOfflineStatus } from "@/context/OfflineProvider";
import { WifiOff } from "@/lib/icons";
import { Banner } from "./banner";
import { BannerStripMotion, useBannerStackItem } from "./banner-stack";
import { RelativeTime } from "./relative-time";
import { SyncRetryButton } from "./sync-retry-button";

/**
 * Amber strip under the header, built on the shared Banner. Shown while the
 * device is offline (we're displaying last-known data) or while offline
 * mutations are waiting to sync, with a retry action for the latter.
 */
export function OfflineBanner({ className }: { className?: string }) {
  const { isOnline, pendingCount, lastSyncAt, flushing, retrySync } =
    useOfflineStatus();
  const { t, i18n } = useTranslation();

  const visible = !isOnline || pendingCount > 0;

  // Registers for the stagger cascade (stable index in the stack) without a
  // dismiss — offline is status, not an offer, so dismiss-all ignores it.
  const { staggerDelay } = useBannerStackItem({
    visible,
    onDismiss: undefined,
  });

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <BannerStripMotion delay={staggerDelay} className={className}>
          <Banner
            variant="strip"
            severity="warning"
            icon={WifiOff}
            title={
              isOnline
                ? t("offline.pendingBanner", { count: pendingCount })
                : t("offline.offlineBanner")
            }
            description={
              !isOnline && lastSyncAt ? (
                <RelativeTime
                  date={lastSyncAt}
                  locale={i18n.language}
                  prefix={t("offline.lastSync")}
                  className="hidden sm:inline"
                />
              ) : undefined
            }
            trailing={
              isOnline && pendingCount > 0 ? (
                <SyncRetryButton
                  onClick={() => void retrySync()}
                  flushing={flushing}
                />
              ) : undefined
            }
          />
        </BannerStripMotion>
      )}
    </AnimatePresence>
  );
}
