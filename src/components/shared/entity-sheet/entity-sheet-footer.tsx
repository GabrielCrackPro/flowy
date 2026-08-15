"use client";

import { Button } from "@components/ui";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sparkles, X } from "@/lib/icons";
import { Icon } from "../icon";
import { SheetActionFooter } from "./sheet-action-footer";

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
    <SheetActionFooter
      className={className}
      start={
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10 w-full rounded-xl text-muted-foreground hover:text-foreground sm:w-auto sm:px-3"
        >
          <X className="mr-2 size-4" />
          {t("common.cancel")}
        </Button>
      }
      end={
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          className="h-12 w-full gap-2 rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 sm:h-10 sm:w-auto sm:min-w-28"
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
      }
    />
  );
}
