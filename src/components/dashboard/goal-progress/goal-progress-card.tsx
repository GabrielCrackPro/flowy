"use client";

import {
  AnimatedNumber,
  CardSkeleton,
  EmptyState,
  EntityAudit,
  GoalIcon,
  Icon,
  SectionCard,
} from "@components/shared";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Target, TrendingUp } from "@/lib/icons";
import type { DashboardData } from "@/types/Dashboard";

interface GoalProgressCardProps {
  month: number;
  year: number;
}

export function GoalProgressCard({ month, year }: GoalProgressCardProps) {
  const { data, isLoading } = useDashboardData(month, year);
  const goals = (data as DashboardData)?.goals ?? [];
  const { profile } = useProfile();
  const { t } = useTranslation();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";
  const topGoals = goals.slice(0, 3);

  return (
    <SectionCard
      title={t("dashboard.goalProgress")}
      description={t("dashboard.goalProgressDesc")}
    >
      {isLoading && goals.length === 0 ? (
        <CardSkeleton variant="bar" />
      ) : topGoals.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Target} size="lg" />}
          title={t("dashboard.noGoals")}
          iconClassName="from-amber-500/20 to-amber-500/10 text-amber-600 dark:from-amber-500/30 dark:to-amber-500/20 dark:text-amber-400"
        />
      ) : (
        <div className="space-y-4 px-5 pb-6 sm:px-6">
          {topGoals.map((goal, index) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(
                    100,
                    Math.round((goal.savedAmount / goal.targetAmount) * 100),
                  )
                : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
            const isNearCompletion = pct >= 80;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="group"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-lg",
                        isNearCompletion
                          ? "bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 dark:from-amber-500/30 dark:to-amber-500/20 dark:text-amber-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon icon={Target} className="size-3.5" />
                    </div>
                    <span className="text-sm font-medium truncate">
                      {goal.title}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full",
                      isNearCompletion
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="relative h-2.5 overflow-hidden rounded-full bg-muted/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                    className={cn(
                      "h-full rounded-full relative overflow-hidden",
                      isNearCompletion
                        ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500",
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

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                  <span className="flex items-center gap-1">
                    <Icon icon={TrendingUp} className="size-3 text-green-500" />
                    <AnimatedNumber
                      value={goal.savedAmount}
                      formatter={(v) => formatCurrency(v, locale, currency)}
                    />
                  </span>
                  <span className="flex items-center gap-1">
                    <AnimatedNumber
                      value={remaining}
                      formatter={(v) => formatCurrency(v, locale, currency)}
                    />
                    <span className="text-muted-foreground/60">
                      {t("dashboard.remaining")}
                    </span>
                  </span>
                </div>

                <EntityAudit
                  createdAt={goal.createdAt}
                  createdBy={goal.user}
                  updatedAt={goal.updatedAt}
                  updatedBy={goal.updatedByProfile}
                  className="mt-1.5"
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
