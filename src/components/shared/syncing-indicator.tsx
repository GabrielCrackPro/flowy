"use client";

import { useIsFetching } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui";
import { Info, Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

// Refetches triggered by navigating to a page with cached data should not be
// labelled as "syncing"; only syncs that happen while settled on a page.
const NAV_SETTLE_MS = 400;

export function SyncingIndicator({ className }: { className?: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(false);

  // Ignore refetches that fire right after navigation (cached queries refetch
  // on mount) so the spinner only reflects syncs while settled on a page.
  // On initial mount the refs match, so we just arm the settle timer instead of
  // early-returning (which would leave the badge permanently unsynced).
  useEffect(() => {
    const navigated = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;
    if (navigated) setSettled(false);
    const timer = setTimeout(() => setSettled(true), NAV_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  const isFetching = useIsFetching({
    predicate: (query) => query.state.data !== undefined,
  });
  const syncing = settled && isFetching > 0;
  const label = syncing ? t("dashboard.syncing") : t("dashboard.synced");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "group relative flex size-6 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
      >
        <span className="flex size-3.5 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {syncing ? (
              <motion.span
                key="syncing"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="flex size-3 shrink-0 items-center justify-center"
              >
                <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
              </motion.span>
            ) : (
              <motion.span
                key="synced"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="flex size-3 shrink-0 items-center justify-center"
              >
                <span className="size-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-lg shadow-black/5 transition-opacity duration-150",
            !open && "group-hover:opacity-100",
          )}
        >
          {label}
        </span>

        <span className="sr-only">{label}</span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-80 p-3"
      >
        <PopoverHeader>
          <PopoverTitle className="flex items-center gap-2">
            <Icon icon={Info} className="size-4 shrink-0 text-primary" />
            {t("dashboard.syncInfo.title")}
          </PopoverTitle>
          <PopoverDescription>
            {t("dashboard.syncInfo.body")}
          </PopoverDescription>
        </PopoverHeader>
        <div className="space-y-1.5 border-t pt-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            </span>
            <span>{t("dashboard.syncInfo.upToDate")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
            </span>
            <span>{t("dashboard.syncing")}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
