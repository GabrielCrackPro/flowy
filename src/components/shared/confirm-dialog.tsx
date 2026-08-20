"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui";
import { Loader2 as Loader2Data } from "lucide";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useHaptic } from "@/hooks/useHaptic";
import { TriangleAlert } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { CONFIRM_TINTS, type ConfirmTint } from "./confirm-tint";
import { Icon } from "./icon";
import { LoadingIcon } from "./loading-icon";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: ReactNode;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "destructive" | "primary";
  /** Color tint for the `primary` confirm action. Defaults to `"primary"`. */
  tint?: ConfirmTint;
  /** Icon glyph rendered inside the header tile (pass a `size-5` glyph). */
  icon?: ReactNode;
  /** Custom body rendered between the header and the footer. */
  children?: ReactNode;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  /**
   * When `false`, the confirm action keeps the dialog open so an async flow
   * can close it itself (e.g. MFA unenroll). Defaults to `true`.
   */
  closeOnConfirm?: boolean;
  /**
   * While an async action is running: swaps the confirm label for a spinner,
   * disables both buttons, blocks dismissal, and keeps the dialog open until
   * the flow closes it. Label defaults to `common.deleting`.
   */
  loading?: boolean;
  loadingLabel?: string;
}

const ICON_TILE_TONES = {
  destructive:
    "from-destructive/20 to-destructive/10 text-destructive shadow-destructive/20",
  primary: "from-primary/20 to-primary/10 text-primary shadow-primary/20",
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = "destructive",
  tint = "primary",
  icon,
  children,
  confirmDisabled = false,
  cancelDisabled = false,
  closeOnConfirm = true,
  loading = false,
  loadingLabel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const haptic = useHaptic();
  const confirmText = confirmLabel ?? t("common.delete");
  const cancelText = cancelLabel ?? t("common.cancel");

  // The destructive case keeps the base AlertDialogAction gradient untouched;
  // the primary case pulls its full override from the shared tint map.
  const actionClassName =
    variant === "destructive" ? "" : CONFIRM_TINTS[tint].action;

  const handleOpenChange = (nextOpen: boolean) => {
    // A running action owns the dialog: ignore dismissal attempts (X,
    // backdrop, Esc) so the flow can close it itself when it settles.
    if (!nextOpen && loading) return;
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-lg",
                ICON_TILE_TONES[variant],
              )}
            >
              {icon ?? <Icon icon={TriangleAlert} className="size-5" />}
            </span>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelDisabled || loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              haptic("heavy");
              if (!closeOnConfirm) {
                event.preventBaseUIHandler();
              }
              onConfirm();
            }}
            disabled={confirmDisabled || loading}
            className={cn("gap-1.5 [&_svg]:size-4", actionClassName)}
          >
            <span className="inline-flex items-center gap-2">
              {loading && <LoadingIcon icon={Loader2Data} loading size={16} />}
              {loading ? (loadingLabel ?? t("common.deleting")) : confirmText}
            </span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
