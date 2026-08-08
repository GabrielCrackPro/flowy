"use client";

import { Button } from "@components/ui";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sparkles, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "../icon";

interface EntitySheetFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  submitIcon?: LucideIcon;
  className?: string;
}

export function EntitySheetFooter({
  onCancel,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  canSubmit = true,
  submitIcon = Sparkles,
  className,
}: EntitySheetFooterProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "border-t border-border/50 bg-gradient-to-r from-muted/30 to-transparent px-6 py-4 flex-col-reverse items-stretch gap-2 shrink-0 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <Button
        variant="ghost"
        onClick={onCancel}
        disabled={isSubmitting}
        className="h-10 w-full sm:w-auto"
      >
        <X className="size-4 mr-2" />
        {t("common.cancel")}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="h-10 w-full gap-1.5 shadow-sm sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <motion.div
              className="size-4 rounded-full border-2 border-current border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {t("common.saving")}
          </>
        ) : (
          <>
            {submitLabel}
            <Icon icon={submitIcon} className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
