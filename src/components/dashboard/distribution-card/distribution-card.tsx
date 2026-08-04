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
import { cn, formatCurrency } from "@/lib/utils";
import { NewTransaction } from "../new-transaction";

interface DistributionCardProps {
  month: number;
  year: number;
}

export function DistributionCard({ month, year }: DistributionCardProps) {
  const { data, isLoading } = useDashboardData(month, year);
  const stats = data?.stats;
  const { profile } = useProfile();
  const { t } = useTranslation();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const income = stats?.incomeThisMonth ?? 0;
  const expenses = stats?.expensesThisMonth ?? 0;
  const savings = income - expenses;
  const total = income + expenses || 1;

  const items = [
    {
      label: t("distribution.income"),
      amount: income,
      color: "from-emerald-500 via-emerald-400 to-emerald-500",
      barColor: "from-emerald-500/20 to-emerald-500/10",
      icon: ArrowUpRight,
      iconBg:
        "from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400",
      percentage: (income / total) * 100,
    },
    {
      label: t("distribution.expenses"),
      amount: expenses,
      color: "from-rose-500 via-rose-400 to-rose-500",
      barColor: "from-rose-500/20 to-rose-500/10",
      icon: ArrowDownRight,
      iconBg:
        "from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400",
      percentage: (expenses / total) * 100,
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
          <div className="relative h-3 overflow-hidden rounded-full bg-muted/50">
            <Skeleton className="h-full w-full" />
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-7">
                      <Skeleton variant="rounded" />
                    </div>
                    <div className="h-4 w-24">
                      <Skeleton />
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

          <div className="flex items-center justify-between border-t border-border/30 pt-4">
            <div className="flex items-center gap-3">
              <div className="size-7">
                <Skeleton variant="rounded" />
              </div>
              <div className="h-4 w-20">
                <Skeleton />
              </div>
            </div>
            <div className="h-6 w-20">
              <Skeleton variant="circular" />
            </div>
          </div>
        </div>
      ) : hasData ? (
        <div className="mt-6 space-y-5 px-5 pb-6 sm:px-6">
          <div className="relative flex h-3 overflow-hidden rounded-full bg-muted/50">
            {items.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, item.percentage)}%` }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                className={cn(
                  "bg-gradient-to-r relative overflow-hidden",
                  item.color,
                )}
              >
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
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
                          "flex size-7 items-center justify-center rounded-lg",
                          item.iconBg,
                        )}
                      >
                        <Icon icon={IconComponent} className="size-3.5" />
                      </div>
                      <span className="text-sm font-medium text-foreground/90">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      <AnimatedNumber
                        value={item.amount}
                        formatter={(v) => formatCurrency(v, locale, currency)}
                      />
                    </span>
                  </div>
                  <div className="mt-2 relative h-1.5 overflow-hidden rounded-full bg-muted/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3 + index * 0.1,
                        ease: "easeOut",
                      }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r relative overflow-hidden",
                        item.barColor,
                      )}
                    >
                      <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between border-t border-border/30 pt-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg",
                  savings >= 0
                    ? "bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400"
                    : "bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400",
                )}
              >
                <Icon icon={TrendingUp} className="size-3.5" />
              </div>
              <span className="text-sm font-medium text-foreground/90">
                {t("distribution.savings")}
              </span>
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums px-2 py-0.5 rounded-full",
                savings >= 0
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  : "bg-gradient-to-r from-rose-500 to-rose-600 text-white",
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
          icon={<Icon icon={TrendingUp} className="size-5" />}
          title={t("distribution.emptyTitle")}
          description={t("distribution.emptyDescription")}
          action={<NewTransaction />}
        />
      )}
    </SectionCard>
  );
}
