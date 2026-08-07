"use client";

import { resolveCategoryIcon } from "@components/categories/category-icons";
import {
  AnimatedNumber,
  CardSkeleton,
  EmptyState,
  Icon,
  SectionCard,
} from "@components/shared";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowDownCircle, Wallet, Tag } from "@/lib/icons";
import type { DashboardData } from "@/types/Dashboard";

interface BudgetProgressCardProps {
  month: number;
  year: number;
}

export function BudgetProgressCard({ month, year }: BudgetProgressCardProps) {
  const { data, isLoading } = useDashboardData(month, year);
  const budgets = (data as DashboardData)?.budgets ?? [];
  const { profile } = useProfile();
  const { t } = useTranslation();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  return (
    <SectionCard
      title={t("dashboard.budgetProgress")}
      description={t("dashboard.budgetProgressDesc")}
    >
      {isLoading && budgets.length === 0 ? (
        <CardSkeleton variant="bar" />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Wallet} size="lg" />}
          title={t("dashboard.noBudgets")}
          iconClassName="from-indigo-500/20 to-indigo-500/10 text-indigo-600 dark:from-indigo-500/30 dark:to-indigo-500/20 dark:text-indigo-400"
        />
      ) : (
        <div className="space-y-3 px-5 pb-6 sm:px-6">
          {budgets.map((budget, index) => {
            const spent = budget.spent || 0;
            const pct =
              budget.budgetLimit > 0
                ? Math.min(100, Math.round((spent / budget.budgetLimit) * 100))
                : 0;
            const overBudget = spent > budget.budgetLimit;
            const isNearLimit = pct >= 80 && !overBudget;
            const remaining = budget.budgetLimit - spent;
            const categoryColor = budget.category?.color || "#6366f1";
            const CategoryIcon = resolveCategoryIcon(budget.category?.icon);

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"
              >
                <div
                  className={cn(
                    "relative rounded-xl border bg-gradient-to-br p-4 shadow-sm transition-all hover:shadow-md",
                    overBudget
                      ? "border-red-500/30 from-red-500/5 to-red-500/0"
                      : isNearLimit
                        ? "border-amber-500/30 from-amber-500/5 to-amber-500/0"
                        : "border-border/40 from-card to-card/50",
                  )}
                  style={{
                    ...(overBudget || isNearLimit
                      ? {}
                      : {
                          background: `linear-gradient(135deg, ${categoryColor}08 0%, ${categoryColor}02 100%)`,
                        }),
                  }}
                >
                  {/* Category Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex size-8 items-center justify-center rounded-lg text-white shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
                          }}
                        >
                          <Icon icon={CategoryIcon} className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold truncate">
                              {budget.category?.name || "—"}
                            </h3>
                            <span
                              className={cn(
                                "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                                overBudget
                                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                  : isNearLimit
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full relative overflow-hidden",
                          overBudget
                            ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500"
                            : isNearLimit
                              ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500"
                              : "",
                        )}
                        style={{
                          ...(overBudget || isNearLimit
                            ? {}
                            : {
                                background: `linear-gradient(90deg, ${categoryColor} 0%, ${categoryColor}cc 50%, ${categoryColor} 100%)`,
                              }),
                        }}
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
                  </div>

                  {/* Amount Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon
                          icon={ArrowDownCircle}
                          className="size-3 text-rose-500"
                        />
                        <span className="font-medium">
                          {t("budgets.expenses")}
                        </span>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-rose-600">
                        <AnimatedNumber
                          value={spent}
                          formatter={(v) => formatCurrency(v, locale, currency)}
                        />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon
                          icon={Wallet}
                          className="size-3"
                          style={{ color: categoryColor }}
                        />
                        <span className="font-medium">
                          {t("budgets.remaining")}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold tabular-nums",
                          remaining >= 0 ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        <AnimatedNumber
                          value={remaining}
                          formatter={(v) => formatCurrency(v, locale, currency)}
                        />
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/30 pt-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground tabular-nums">
                      <span className="font-medium">
                        <AnimatedNumber
                          value={spent}
                          formatter={(v) => formatCurrency(v, locale, currency)}
                        />
                      </span>
                      <span className="text-muted-foreground/40">/</span>
                      <span className="font-semibold text-foreground">
                        <AnimatedNumber
                          value={budget.budgetLimit}
                          formatter={(v) => formatCurrency(v, locale, currency)}
                        />
                      </span>
                    </div>
                    {overBudget && (
                      <div className="flex items-center gap-1 text-destructive">
                        <Icon icon={AlertTriangle} className="size-3" />
                        <span className="tabular-nums">
                          <AnimatedNumber
                            value={spent - budget.budgetLimit}
                            formatter={(v) =>
                              formatCurrency(v, locale, currency)
                            }
                          />{" "}
                          {t("dashboard.exceededBy")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
