"use client";

import { Button } from "@components/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, TransactionForm, TransactionIcon } from "@/components/shared";
import { useTransactionApi } from "@/hooks/api";
import { Plus } from "@/lib/icons";
import type { CreateTransactionSchema } from "@/lib/schemas";

interface NewTransactionProps {
  size?: "sm" | "default";
  openInSheet?: boolean;
}

const DEFAULT_VALUES: CreateTransactionSchema = {
  type: "EXPENSE",
  amount: 0,
  description: "",
  date: new Date(),
  categoryIds: [],
  isRecurring: false,
  budgetId: undefined,
};

export function NewTransaction({
  size = "default",
  openInSheet,
}: NewTransactionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { create } = useTransactionApi();

  const isSmall = size === "sm";

  const triggerClassName = cn(
    "gap-2 transition duration-300",

    isSmall
      ? "h-9 rounded-lg px-3 shadow-md"
      : "h-12 w-full rounded-xl shadow-lg",

    "bg-linear-to-r from-primary to-primary/90",
    "hover:from-primary/95 hover:to-primary/90",
    "shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
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
        )}
      >
        <Icon icon={Plus} className={cn(isSmall ? "size-3" : "size-3.5")} />
      </motion.span>

      <span
        className={cn(
          "font-semibold tracking-tight",
          isSmall ? "text-sm" : "text-[0.9rem]",
        )}
      >
        {t("nav.newTransaction")}
      </span>
    </>
  );

  if (openInSheet) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <Button className={triggerClassName} onClick={() => setOpen(true)}>
          {content}
        </Button>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5 text-left bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 text-indigo-600 dark:from-indigo-500/30 dark:to-indigo-500/20 dark:text-indigo-400">
                <TransactionIcon size="lg" />
              </div>
              <SheetTitle className="text-lg">
                {t("nav.newTransaction")}
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <TransactionForm
              mode="create"
              initialValues={DEFAULT_VALUES}
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
