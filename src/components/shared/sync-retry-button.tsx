"use client";

import { RotateCcw } from "lucide";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LoadingIcon } from "./loading-icon";

interface SyncRetryButtonProps {
  onClick: () => void;
  /** True while a flush is in flight — shows a spinner and disables the button. */
  flushing?: boolean;
  /** Override the default "Reintentar" label. */
  label?: string;
  className?: string;
}

/**
 * Amber pill that triggers a retry of the offline mutation queue. Shared by
 * the offline banner and the sync status popover so both keep the same look.
 */
export function SyncRetryButton({
  onClick,
  flushing = false,
  label,
  className,
}: SyncRetryButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={flushing}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 font-semibold text-amber-700 transition-colors hover:bg-amber-500/25 disabled:opacity-60 dark:text-amber-400",
        className,
      )}
    >
      <LoadingIcon icon={RotateCcw} loading={flushing} size={12} aria-hidden />
      <span>{label ?? t("offline.retry")}</span>
    </button>
  );
}
