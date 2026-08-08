"use client";

import {
  AnimatedNumber,
  EmptyState,
  Icon,
  SectionCard,
  Skeleton,
} from "@components/shared";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet } from "@/lib/icons";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import type { DashboardData } from "@/types/Dashboard";
import { NewTransaction } from "../new-transaction";

interface DistributionCardProps {
  month: number;
  year: number;
}

export function DistributionCard({ month, year }: DistributionCardProps) {
  const { data, isLoading } = useDashboardData(month, year);
  const stats = (data as DashboardData)?.stats;
  const { profile } = useProfile();
  const { t } = useTranslation();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const income = stats?.incomeThisMonth ?? 0;
  const expenses = stats?.expensesThisMonth ?? 0;
  const savings = income - expenses;
  const total = income || 1;
  const savingsRate = income > 0 ? (savings / income) * 100 : null;
  const expensesPct = income > 0 ? (expenses / income) * 100 : 0;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;

  const items = [
    {
      label: t("distribution.income"),
      amount: income,
      color: "from-emerald-500 via-emerald-400 to-emerald-500",
      barColor: "from-emerald-500/20 to-emerald-500/10",
      icon: ArrowUpRight,
      iconBg:
        "from-emerald-500/20 to-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/25",
      pct: income > 0 ? 100 : 0,
      subtitle: null,
    },
    {
      label: t("distribution.expenses"),
      amount: expenses,
      color: "from-rose-500 via-rose-400 to-rose-500",
      barColor: "from-rose-500/20 to-rose-500/10",
      icon: ArrowDownRight,
      iconBg:
        "from-rose-500/20 to-rose-500/10 text-rose-600 ring-rose-500/15 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400 dark:ring-rose-500/25",
      pct: expensesPct,
      subtitle: income > 0
        ? `${formatPercentage(expensesPct, locale, 1)} ${t("distribution.ofIncome")}`
        : null,
    },
  ];

  const hasData = !!income || !!expenses;

  return (
    <SectionCard
      icon={<Icon icon={Wallet} className="size-5" />}
      title={t("distribution.title")}
      description={t("distribution.description")}
    >
      {isLoading ? (
        <div className="mt-6 space-y-5 px-5 pb-6 sm:px-6">
          <div className="relative h-4 overflow-hidden rounded-full bg-muted/50 ring-1 ring-inset ring-border/40">
            <Skeleton className="h-full w-full" />
          </div>

          <div className="space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8">
                      <Skeleton variant="rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-24">
                        <Skeleton />
                      </div>
                      <div className="h-3 w-12">
                        <Skeleton />
                      </div>
                    </div>
                  </div>
                  <div className="h-4 w-20">
                    <Skeleton />
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <Skeleton className="h-full w-3/4" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="size-8">
                <Skeleton variant="rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20">
                  <Skeleton />
                </div>
                <div className="h-3 w-24">
                  <Skeleton />
                </div>
              </div>
            </div>
            <div className="h-6 w-24">
              <Skeleton variant="circular" />
            </div>
          </div>
        </div>
      ) : hasData ? (
        <div className="mt-6 space-y-5 px-5 pb-6 sm:px-6">
          {/* Stacked bar with inline labels + legend */}
          <div className="space-y-2.5">
            <div
              className={cn(
                "relative flex h-4 overflow-hidden rounded-full shadow-inner ring-1 ring-inset",
                expensesPct > 80
                  ? "bg-rose-500/10 ring-rose-500/20"
                  : "bg-muted/50 ring-border/40",
              )}
            >
              {/* Expenses segment */}
              {expensesPct > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, expensesPct)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-r",
                    expensesPct > 80
                      ? "from-rose-600 via-rose-500 to-rose-600"
                      : "from-rose-500 via-rose-400 to-rose-500",
                  )}
                >
                  {/* Shimmer */}
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                </motion.div>
              )}
              {/* Savings segment */}
              {savingsPct > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, savingsPct)}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.05,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-r",
                    savingsPct < 20
                      ? "from-amber-500 via-amber-400 to-amber-500"
                      : "from-blue-500 via-blue-400 to-blue-500",
                  )}
                >
                  {/* Shimmer */}
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                </motion.div>
              )}
            </div>

            {/* Legend row */}
            <div className="flex items-center gap-5 text-[11px] text-muted-foreground/70">
              <span className="flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-full bg-rose-500" />
                {t("distribution.expenses")}{" "}
                {formatPercentage(expensesPct, locale, 0)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                {t("distribution.savings")}{" "}
                {formatPercentage(savingsPct, locale, 0)}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {items.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset",
                          item.iconBg,
                        )}
                      >
                        <Icon icon={IconComponent} className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground/90">
                          {item.label}
                        </span>
                        <span className="text-[11px] tabular-nums text-muted-foreground/60">
                          {item.subtitle ?? formatPercentage(item.pct, locale, 1)}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      <AnimatedNumber
                        value={item.amount}
                        formatter={(v) => formatCurrency(v, locale, currency)}
                      />
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted/60 shadow-inner ring-1 ring-inset ring-border/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, Math.max(0, item.pct))}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3 + index * 0.1,
                        ease: "easeOut",
                      }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r shadow-sm",
                        item.barColor,
                      )}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-br from-muted/40 to-muted/5 px-4 py-3 ring-1 ring-inset ring-border/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset",
                  savings >= 0
                    ? "from-blue-500/20 to-blue-500/10 text-blue-600 ring-blue-500/15 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400 dark:ring-blue-500/25"
                    : "from-rose-500/20 to-rose-500/10 text-rose-600 ring-rose-500/15 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400 dark:ring-rose-500/25",
                )}
              >
                <Icon icon={TrendingUp} className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground/90">
                  {t("distribution.savings")}
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  {t("distribution.savingsRate")}
                  {savingsRate !== null
                    ? `: ${formatPercentage(savingsRate, locale, 1)}`
                    : ""}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular-nums text-white shadow-sm",
                savings >= 0
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : "bg-gradient-to-r from-rose-500 to-rose-600",
              )}
            >
              <AnimatedNumber
                value={savings}
                formatter={(v) => formatCurrency(v, locale, currency)}
              />
            </span>
          </motion.div>
        </div>
      ) : (
        <EmptyState
          icon={<Icon icon={TrendingUp} size="lg" />}
          title={t("distribution.emptyTitle")}
          description={t("distribution.emptyDescription")}
          iconClassName="from-emerald-500/20 to-emerald-500/10 text-emerald-600 ring-emerald-500/10 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400"
          action={<NewTransaction />}
        />
      )}
    </SectionCard>
  );
}
