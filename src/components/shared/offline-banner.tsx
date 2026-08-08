"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useOfflineStatus } from "@/context/OfflineProvider";
import { WifiOff } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { RelativeTime } from "./relative-time";
import { SyncRetryButton } from "./sync-retry-button";

/**
 * Amber strip under the header. Shown while the device is offline (we're
 * displaying last-known data) or while offline mutations are waiting to sync,
 * with a retry action for the latter.
 */
export function OfflineBanner({ className }: { className?: string }) {
  const { isOnline, pendingCount, lastSyncAt, flushing, retrySync } =
    useOfflineStatus();
  const { t, i18n } = useTranslation();

  const visible = !isOnline || pendingCount > 0;

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
          <output
            className={cn(
              "block w-full border-b border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400",
              className,
            )}
          >
            <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
              <WifiOff
                aria-hidden
                className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
              />
              <p className="truncate">
                {isOnline
                  ? t("offline.pendingBanner", { count: pendingCount })
                  : t("offline.offlineBanner")}
              </p>

              {!isOnline && lastSyncAt && (
                <RelativeTime
                  date={lastSyncAt}
                  locale={i18n.language}
                  prefix={t("offline.lastSync")}
                  className="hidden shrink-0 text-amber-600/80 dark:text-amber-400/70 sm:inline"
                />
              )}

              {isOnline && pendingCount > 0 && (
                <SyncRetryButton
                  onClick={() => void retrySync()}
                  flushing={flushing}
                  className="ml-auto"
                />
              )}
            </div>
          </output>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
