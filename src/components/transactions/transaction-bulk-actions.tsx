"use client";

import { Button } from "@components/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide";
import { LoadingIcon } from "@/components/shared/loading-icon";

interface TransactionBulkActionsProps {
  selectedCount: number;
  deleting?: boolean;
  onDelete: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export function TransactionBulkActions({
  selectedCount,
  deleting = false,
  onDelete,
  t,
}: TransactionBulkActionsProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border/50 bg-primary/3 px-6 py-2">
            <p className="text-xs font-medium text-foreground/80">
              {t("transactions.selectedCount", { count: selectedCount })}
            </p>
            <Button
              variant="ghost"
              size="xs"
              onClick={onDelete}
              disabled={deleting}
              className="text-destructive/80 hover:text-destructive disabled:opacity-50"
            >
              <LoadingIcon icon={Trash2} loading={deleting} size={14} />{" "}
              {deleting ? t("common.deleting") : t("transactions.delete")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
