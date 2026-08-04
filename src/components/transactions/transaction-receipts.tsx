"use client";

import { EmptyState, Icon, SectionCard } from "@components/shared";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { parseDateOnly } from "@/lib/date-only";
import { ExternalLink, FileText, Receipt } from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/Transaction";

const IMAGE_RE = /\.(png|jpe?g|webp|gif|svg|avif|bmp)(\?.*)?$/i;

interface TransactionReceiptsProps {
  transactions: Transaction[];
  locale: string;
  currency: string;
  t: (key: string) => string;
}

function isImageUrl(url: string): boolean {
  return IMAGE_RE.test(url);
}

function fileName(url: string): string {
  const part = url.split("/").pop() ?? url;
  return part.split("?")[0] || "receipt";
}

function toNumber(value: number | string | null | undefined): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export function TransactionReceipts({
  transactions,
  locale,
  currency,
  t,
}: TransactionReceiptsProps) {
  const receipts = useMemo(
    () =>
      transactions
        .filter((tx) => tx.receiptUrl)
        .sort((a, b) => {
          const ta = parseDateOnly(a.date) ?? new Date(a.createdAt);
          const tb = parseDateOnly(b.date) ?? new Date(b.createdAt);
          return tb.getTime() - ta.getTime();
        }),
    [transactions],
  );

  return (
    <SectionCard
      title={t("transactions.receiptsTitle")}
      description={t("transactions.receiptsDesc")}
    >
      {receipts.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
          {receipts.map((tx) => {
            const url = tx.receiptUrl as string;
            const isImage = isImageUrl(url);
            const isIncome = tx.type === "INCOME";

            return (
              <motion.a
                key={tx.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex overflow-hidden rounded-xl border border-border/30 bg-linear-to-br from-muted/20 to-muted/10 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden bg-muted/40">
                  {isImage ? (
                    /* biome-ignore lint/performance/noImgElement: Receipts are served from Supabase public storage. */
                    <img
                      src={url}
                      alt={tx.description ?? "receipt"}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Icon icon={FileText} className="size-7" />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-3">
                  <p className="truncate text-sm font-medium text-foreground/90">
                    {tx.description || fileName(url)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.date
                      ? new Intl.DateTimeFormat(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(parseDateOnly(tx.date) ?? new Date(tx.date))
                      : ""}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(toNumber(tx.amount), locale, currency)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center pr-3 text-muted-foreground/40 transition-colors group-hover:text-foreground">
                  <Icon icon={ExternalLink} className="size-4" />
                </div>
              </motion.a>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Icon icon={Receipt} className="size-5" />}
          title={t("transactions.receiptsTitle")}
          description={t("transactions.receiptsEmpty")}
        />
      )}
    </SectionCard>
  );
}
