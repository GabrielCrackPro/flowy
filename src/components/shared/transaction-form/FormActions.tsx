"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { Loader2, Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "../icon";

export function FormActions({
  embedded = false,
  isExpense,
  busy,
  disabled,
  mode,
  onSave,
  onCancel,
}: {
  embedded?: boolean;
  isExpense: boolean;
  busy: boolean;
  disabled: boolean;
  mode: "create" | "edit";
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className={cn(
        "flex flex-col-reverse gap-2",
        embedded
          ? "sticky bottom-0 z-10 -mx-4 border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6"
          : "lg:col-span-2 lg:flex-row lg:items-center lg:justify-end lg:gap-3",
      )}
    >
      <Button
        variant="ghost"
        onClick={onCancel}
        className="w-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/30 sm:w-auto sm:px-6"
      >
        {t("transaction.cancel")}
      </Button>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onSave}
          disabled={disabled || busy}
          size="lg"
          className={cn(
            "w-full text-primary-foreground shadow-lg sm:w-auto sm:min-w-44",
            isExpense
              ? "bg-linear-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
              : "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
          )}
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Icon icon={Loader2} className="size-4 animate-spin" />
              {t("transaction.saving")}
            </span>
          ) : (
            <>
              <Icon icon={Plus} className="size-4" />
              {mode === "edit"
                ? t("transaction.saveChanges")
                : t("transaction.save")}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
