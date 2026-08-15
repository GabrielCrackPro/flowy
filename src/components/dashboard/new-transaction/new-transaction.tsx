"use client";

import { Button } from "@components/ui";
import { Sheet, SheetContent } from "@components/ui/sheet";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  EntitySheetHeader,
  getDefaultTransactionValues,
  Icon,
  TransactionForm,
  TransactionIcon,
} from "@/components/shared";
import { useTransactionApi } from "@/hooks/api";
import { Plus } from "@/lib/icons";
import type { CreateTransactionSchema } from "@/lib/schemas";

interface NewTransactionProps {
  size?: "sm" | "default";
  openInSheet?: boolean;
  compactMobile?: boolean;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function NewTransaction({
  size = "default",
  openInSheet,
  compactMobile = false,
  controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: NewTransactionProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const { create } = useTransactionApi(undefined, { enabled: false });

  const isSmall = size === "sm";

  const triggerClassName = cn(
    "gap-2 transition duration-300",

    isSmall
      ? "h-10 rounded-xl px-3 shadow-sm sm:h-9"
      : "h-12 w-full rounded-xl shadow-lg",

    "bg-linear-to-r from-primary to-primary/90",
    "hover:from-primary/95 hover:to-primary/90",
    "shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
    compactMobile && "max-sm:size-10 max-sm:gap-0 max-sm:px-0",
  );

  const onSubmit = async (values: CreateTransactionSchema) => {
    await create(values);
    setOpen(false);
  };

  const content = (
    <>
      <motion.span
        whileHover={{ rotate: 360, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        className={cn(
          "flex items-center justify-center rounded-lg bg-linear-to-br from-primary-foreground/20 to-primary-foreground/10 transition duration-300 shadow-sm",

          isSmall ? "size-5" : "size-6",
          compactMobile &&
            "max-sm:size-6 max-sm:rounded-none max-sm:bg-transparent max-sm:shadow-none",
        )}
      >
        <Icon
          icon={Plus}
          className={cn(
            isSmall ? "size-3" : "size-3.5",
            compactMobile && "max-sm:text-white",
          )}
        />
      </motion.span>

      <span
        className={cn(
          "font-semibold tracking-tight",
          isSmall ? "text-sm" : "text-[0.9rem]",
          compactMobile && "max-sm:hidden",
        )}
      >
        {t("nav.newTransaction")}
      </span>
    </>
  );

  if (openInSheet) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        {!hideTrigger && (
          <Button
            type="button"
            className={triggerClassName}
            onClick={() => setOpen(true)}
          >
            {content}
          </Button>
        )}
        <SheetContent
          side="right"
          aria-labelledby="new-transaction-title"
          className="flex w-full min-w-0 flex-col overflow-hidden p-0 h-full sm:max-w-xl"
        >
          <EntitySheetHeader
            icon={<TransactionIcon size="md" />}
            iconGradient="from-primary/20 to-primary/10"
            iconColor="text-primary"
            title={t("nav.newTransaction")}
            subtitle={t("transaction.formHint")}
            metadata={
              <span className="truncate">
                {t("transaction.expense")} · {t("transaction.income")}
              </span>
            }
            titleId="new-transaction-title"
          />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <TransactionForm
              mode="create"
              initialValues={getDefaultTransactionValues()}
              onSubmit={onSubmit}
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
              embedded
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Button asChild className={triggerClassName}>
      <Link href="/dashboard/transactions/add" className="group">
        {content}
      </Link>
    </Button>
  );
}
