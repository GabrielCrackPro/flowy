"use client";

import {
  AnimatedNumber,
  EmptyState,
  ExpenseIcon,
  Icon,
  IncomeIcon,
  SectionCard,
  Skeleton,
} from "@components/shared";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { parseDateOnly } from "@/lib/date-only";
import { ArrowRight, Receipt } from "@/lib/icons";
import type { DashboardData } from "@/types/Dashboard";

interface RecentTransactionsCardProps {
  month: number;
  year: number;
}

export function RecentTransactionsCardSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((row, index) => (
        <motion.div
          key={row}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex items-center gap-4 border-t border-border/30 px-5 py-3.5 sm:px-6"
        >
          <Skeleton variant="circular" className="size-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton
              className={cn("h-3.5", index % 2 === 0 ? "w-1/2" : "w-2/5")}
            />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </motion.div>
      ))}
    </div>
  );
}

export function RecentTransactionsCard({
  month,
  year,
}: RecentTransactionsCardProps) {
  const { data, isLoading } = useDashboardData(month, year);
  const { profile } = useProfile();
  const { t } = useTranslation();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const recent = ((data as DashboardData)?.recentTransactions ?? []).map(
    (tx) => ({
      ...tx,
      amount:
        typeof tx.amount === "number" ? tx.amount : Number(tx.amount) || 0,
    }),
  );

  return (
    <SectionCard
      icon={<Icon icon={Receipt} className="size-5" />}
      title={t("dashboard.recentTransactions")}
      description={t("dashboard.recentTransactionsDesc")}
      action={
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("dashboard.viewAll")}
          <Icon icon={ArrowRight} className="size-3.5" />
        </Link>
      }
    >
      {isLoading && recent.length === 0 ? (
        <RecentTransactionsCardSkeleton />
      ) : recent.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Receipt} size="lg" />}
          title={t("dashboard.noTransactions")}
          description={t("dashboard.noTransactionsDesc")}
          iconClassName="from-rose-500/20 to-rose-500/10 text-rose-600 ring-rose-500/10 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400"
          action={
            <Link
              href="/dashboard/transactions/add"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("nav.newTransaction")}
              <Icon icon={ArrowRight} className="size-3.5" />
            </Link>
          }
        />
      ) : (
        <div>
          {recent.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center gap-4 border-t border-border/30 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40 sm:px-6"
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110",
                  tx.type === "INCOME"
                    ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400"
                    : "bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400",
                )}
              >
                {tx.type === "INCOME" ? (
                  <IncomeIcon size="lg" />
                ) : (
                  <ExpenseIcon size="lg" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {tx.description || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.date
                    ? (
                        parseDateOnly(tx.date) ?? new Date(tx.date)
                      ).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                      })
                    : "—"}
                </p>
              </div>

              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums transition-colors",
                  tx.type === "INCOME"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {tx.type === "INCOME" ? "+" : "-"}
                <AnimatedNumber
                  value={tx.amount}
                  formatter={(v) => formatCurrency(v, locale, currency)}
                />
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
