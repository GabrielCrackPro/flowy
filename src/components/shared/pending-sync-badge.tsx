"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui";
import { Clock } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Amber pill shown on entity rows whose data was saved locally while offline
 * and is still waiting to sync (see the `_pendingSync` flag in useEntityApi).
 */
export function PendingSyncBadge({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 gap-1.5 whitespace-nowrap border-amber-500/40 bg-amber-500/10 font-medium text-amber-700 dark:text-amber-400",
        className,
      )}
    >
      <Clock aria-hidden className="size-3 shrink-0" />
      <span>{t("offline.pendingLabel")}</span>
    </Badge>
  );
}
