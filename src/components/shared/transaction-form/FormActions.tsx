"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { Command, Loader2, Plus } from "@/lib/icons";
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
      className={cn("flex flex-col gap-2", embedded ? "" : "lg:col-start-2")}
    >
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onSave}
          disabled={disabled || busy}
          size="lg"
          className={cn(
            "w-full text-primary-foreground shadow-lg",
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
          <kbd className="ml-2 flex items-center gap-0.5 rounded-md border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] text-primary-foreground">
            <Icon icon={Command} className="size-2.5" />
            <span>↵</span>
          </kbd>
        </Button>
      </motion.div>
      <Button
        variant="ghost"
        onClick={onCancel}
        className="w-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
      >
        {t("transaction.cancel")}
      </Button>
    </motion.div>
  );
}
