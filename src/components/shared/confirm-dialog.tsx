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
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useHaptic } from "@/hooks/useHaptic";
import { TriangleAlert } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: ReactNode;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "destructive" | "default";
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
}

const VARIANT_STYLES = {
  // AlertDialogAction already ships the canonical destructive gradient, so the
  // destructive case is left unoverridden to stay in sync with the Button
  // `destructive` variant.
  destructive: "",
  default:
    "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:from-primary/90 hover:to-primary/80 hover:shadow-lg",
};

const ICON_TILE_TONES = {
  destructive:
    "from-destructive/20 to-destructive/10 text-destructive shadow-destructive/20",
  default: "from-primary/20 to-primary/10 text-primary shadow-primary/20",
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
  icon,
  children,
  confirmDisabled = false,
  cancelDisabled = false,
  closeOnConfirm = true,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const haptic = useHaptic();
  const confirmText = confirmLabel ?? t("common.delete");
  const cancelText = cancelLabel ?? t("common.cancel");

  const actionClassName = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel disabled={cancelDisabled}>
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
            disabled={confirmDisabled}
            className={cn("gap-1.5 [&_svg]:size-4", actionClassName)}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
