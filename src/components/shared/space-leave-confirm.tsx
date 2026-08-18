"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui";
import { useSpaceLeave } from "@/hooks/useSpaceLeave";
import type { SpaceSummary } from "@/lib/api/space";
import { Loader2, LogOut, Trash2, X } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SpaceLeaveConfirmProps {
  space: SpaceSummary;
  className?: string;
  /** Shows a close button so the expanded step can collapse. */
  onCancel?: () => void;
  /** Fired after the leave/delete mutation runs. */
  onConfirmed?: () => void;
}

/**
 * Inline destructive confirm for leaving or deleting a space, rendered as a
 * step inside the space switcher sheet. Decides between leave and delete via
 * `useSpaceLeave`, so it never contradicts the profile page's dialog.
 */
export function SpaceLeaveConfirm({
  space,
  className,
  onCancel,
  onConfirmed,
}: SpaceLeaveConfirmProps) {
  const { t } = useTranslation();
  const { isOnlyMember, isPending, handleConfirm } = useSpaceLeave(space);

  const confirm = () => {
    handleConfirm();
    onConfirmed?.();
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {onCancel ? (
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Icon
              icon={isOnlyMember ? Trash2 : LogOut}
              className="size-4 text-destructive"
            />
            {isOnlyMember
              ? t("profile.spaces.deleteSpace")
              : t("profile.spaces.leaveSpace")}
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("common.close")}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Icon icon={X} className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <Icon icon={isOnlyMember ? Trash2 : LogOut} className="size-4" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-semibold text-foreground">
              &ldquo;{space.name}&rdquo;
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isOnlyMember
                ? t("profile.spaces.leaveConfirmOwnerDescription")
                : t("profile.spaces.leaveConfirmDescription")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="h-11 w-full sm:h-10 sm:w-auto"
        >
          {t("profile.spaces.cancel")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={confirm}
          disabled={isPending}
          className="h-11 w-full gap-1.5 sm:h-10 sm:w-auto"
        >
          {isPending ? (
            <Icon icon={Loader2} className="size-3.5 animate-spin" />
          ) : (
            <Icon icon={isOnlyMember ? Trash2 : LogOut} className="size-3.5" />
          )}
          {isOnlyMember
            ? t("profile.spaces.deleteSpace")
            : t("profile.spaces.leaveSpace")}
        </Button>
      </div>
    </div>
  );
}
