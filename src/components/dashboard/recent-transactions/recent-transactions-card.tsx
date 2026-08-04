"use client";

import {
  AnimatedNumber,
  CardSkeleton,
  EmptyState,
  ExpenseIcon,
  Icon,
  IncomeIcon,
  SectionCard,
} from "@components/shared";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { parseDateOnly } from "@/lib/date-only";
import { ArrowRight, Receipt } from "@/lib/icons";

interface RecentTransactionsCardProps {
  month: number;
  year: number;
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

  const recent = (data?.recentTransactions ?? []).map((tx) => ({
    ...tx,
    amount: typeof tx.amount === "number" ? tx.amount : Number(tx.amount) || 0,
  }));

  return (
    <SectionCard
      title={t("dashboard.recentTransactions")}
      description={t("dashboard.recentTransactionsDesc")}
      action={
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("dashboard.viewAll")}
          <Icon icon={ArrowRight} className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {isLoading && recent.length === 0 ? (
        <div>
          <CardSkeleton variant="row" count={5} />
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Receipt} className="size-5" />}
          title={t("dashboard.noTransactions")}
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
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110",
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
