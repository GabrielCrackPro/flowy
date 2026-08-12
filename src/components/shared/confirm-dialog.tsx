"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@components/ui";
import type { ReactNode } from "react";
import { useHaptic } from "@/hooks/useHaptic";
import { TriangleAlert } from "@/lib/icons";
import { Icon } from "./icon";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "destructive" | "default";
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "destructive",
  icon,
}: ConfirmDialogProps) {
  const haptic = useHaptic();

  const VARIANT_STYLES = {
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
  };

  const actionClassName = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  const handleConfirm = () => {
    haptic("heavy");
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {icon ?? (
              <AlertDialogMedia>
                <Icon
                  icon={TriangleAlert}
                  className="size-6 text-destructive"
                />
              </AlertDialogMedia>
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={actionClassName}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
