"use client";

import {
  ActivityFeedCard,
  BudgetProgressCard,
  DashboardAlerts,
  DashboardHeader,
  DistributionCard,
  GoalProgressCard,
  MonthPicker,
  RecentTransactionsCard,
  SubscriptionCardList,
} from "@components/dashboard";
import { ChartCardSkeleton } from "@components/dashboard/charts/chart-card";
import { Skeleton, StatsCardGroup } from "@components/shared";
import { ErrorBoundary } from "@components/shared/error-boundary";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import { cn } from "@/lib/utils";

// Dynamic imports for heavy chart components
const CashFlowChart = dynamic(
  () =>
    import("@components/dashboard/charts/cash-flow-chart").then((mod) => ({
      default: mod.CashFlowChart,
    })),
  {
    loading: () => <ChartCardSkeleton />,
    ssr: false, // Charts can be client-only
  },
);

const ExpenseDistributionChart = dynamic(
  () =>
    import("@components/dashboard/charts/expense-distribution-chart").then(
      (mod) => ({ default: mod.ExpenseDistributionChart }),
    ),
  {
    loading: () => <ChartCardSkeleton />,
    ssr: false,
  },
);

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function SectionHeading({
  title,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// Skeleton components for dashboard cards
function DistributionCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10">
          <Skeleton variant="rounded" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
      </div>
      <div className="space-y-4 pt-4">
        <div className="h-3 w-full">
          <Skeleton />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6">
                    <Skeleton variant="rounded" />
                  </div>
                  <div className="h-4 w-20">
                    <Skeleton />
                  </div>
                </div>
                <div className="h-4 w-16">
                  <Skeleton />
                </div>
              </div>
              <div className="h-2 w-full">
                <Skeleton />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function RecentTransactionsCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10">
          <Skeleton variant="rounded" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-t border-border/30 py-3"
          >
            <div className="h-8 w-8">
              <Skeleton variant="rounded" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32">
                <Skeleton />
              </div>
              <div className="h-3 w-20">
                <Skeleton />
              </div>
            </div>
            <div className="h-4 w-16">
              <Skeleton />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function BudgetProgressCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10">
          <Skeleton variant="rounded" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border/20 bg-muted/20 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6">
                  <Skeleton variant="rounded" />
                </div>
                <div className="h-4 w-20">
                  <Skeleton />
                </div>
              </div>
              <div className="h-5 w-8">
                <Skeleton variant="rounded" />
              </div>
            </div>
            <div className="h-2 w-full">
              <Skeleton />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function GoalProgressCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10">
          <Skeleton variant="rounded" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border/20 bg-muted/20 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24">
                <Skeleton />
              </div>
              <div className="h-4 w-16">
                <Skeleton />
              </div>
            </div>
            <div className="h-2 w-full">
              <Skeleton />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SubscriptionCardListSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10">
          <Skeleton variant="rounded" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/20 p-3"
          >
            <div className="h-8 w-8">
              <Skeleton variant="rounded" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-4 w-24">
                <Skeleton />
              </div>
              <div className="h-3 w-16">
                <Skeleton />
              </div>
            </div>
            <div className="h-4 w-12">
              <Skeleton />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ActivityFeedCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10">
          <Skeleton variant="rounded" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-2 w-2 shrink-0">
              <Skeleton variant="circular" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full">
                <Skeleton />
              </div>
              <div className="h-3 w-3/4">
                <Skeleton />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { isCardEnabled } = useDashboardCards();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const skipPersist = useRef(true);

  useEffect(() => {
    const storedMonth = Number(window.localStorage.getItem("flowy.month"));
    const storedYear = Number(window.localStorage.getItem("flowy.year"));
    if (
      Number.isInteger(storedMonth) &&
      storedMonth >= 1 &&
      storedMonth <= 12
    ) {
      setMonth(storedMonth);
    }
    if (Number.isInteger(storedYear) && storedYear >= 2000) {
      setYear(storedYear);
    }
  }, []);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    window.localStorage.setItem("flowy.month", String(month));
    window.localStorage.setItem("flowy.year", String(year));
  }, [month, year]);

  const handleMonthChange = useCallback((m: number, y: number) => {
    setMonth(m);
    setYear(y);
  }, []);

  const showStats = isCardEnabled("stats");
  const showCashFlow = isCardEnabled("cashFlow");
  const showExpenseDistribution = isCardEnabled("expenseDistribution");
  const showDistribution = isCardEnabled("distribution");
  const showRecentTransactions = isCardEnabled("recentTransactions");
  const showBudgetProgress = isCardEnabled("budgetProgress");
  const showGoalProgress = isCardEnabled("goalProgress");
  const showSubscriptions = isCardEnabled("subscriptions");
  const showActivity = isCardEnabled("activity");

  const showCharts = showCashFlow || showExpenseDistribution;
  const showMainColumn =
    showDistribution ||
    showRecentTransactions ||
    showBudgetProgress ||
    showGoalProgress;
  const showAside = showSubscriptions || showActivity;
  const showAnalysis = showCharts || showMainColumn || showAside;

  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense
        fallback={
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12">
                <Skeleton variant="rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-7 w-48">
                  <Skeleton />
                </div>
                <div className="h-5 w-32">
                  <Skeleton />
                </div>
              </div>
            </div>
          </motion.div>
        }
      >
        <DashboardHeader month={month} year={year} />
      </Suspense>

      <Suspense
        fallback={
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-16 rounded-2xl border border-border/30 bg-card"
          >
            <Skeleton className="h-full w-full" />
          </motion.div>
        }
      >
        <DashboardAlerts month={month} year={year} />
      </Suspense>

      <section className="space-y-5">
        <SectionHeading
          title={t("dashboard.financialSummary")}
          description={t("dashboard.financialSummaryDesc")}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <MonthPicker
                month={month}
                year={year}
                onChange={handleMonthChange}
              />
            </div>
          }
        />
        {showStats && (
          <ErrorBoundary>
            <StatsCardGroup month={month} year={year} />
          </ErrorBoundary>
        )}
      </section>

      {showAnalysis && (
        <section className="space-y-5">
          <SectionHeading
            title={t("dashboard.analysis")}
            description={t("dashboard.analysisDesc")}
          />

          {showCharts && (
            <div
              className={cn(
                "grid grid-cols-1 gap-4 sm:gap-6",
                showCashFlow && showExpenseDistribution && "xl:grid-cols-3",
              )}
            >
              {showCashFlow && (
                <div className={cn(showExpenseDistribution && "xl:col-span-2")}>
                  <ErrorBoundary>
                    <Suspense fallback={<ChartCardSkeleton />}>
                      <CashFlowChart month={month} year={year} />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              )}
              {showExpenseDistribution && (
                <div>
                  <ErrorBoundary>
                    <Suspense fallback={<ChartCardSkeleton />}>
                      <ExpenseDistributionChart month={month} year={year} />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              )}
            </div>
          )}

          {(showMainColumn || showAside) && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
              {showMainColumn && (
                <div
                  className={cn(
                    "flex flex-col gap-4 sm:gap-6",
                    showAside ? "xl:col-span-2" : "xl:col-span-3",
                  )}
                >
                  {showDistribution && (
                    <ErrorBoundary>
                      <Suspense fallback={<DistributionCardSkeleton />}>
                        <DistributionCard month={month} year={year} />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {showRecentTransactions && (
                    <ErrorBoundary>
                      <Suspense fallback={<RecentTransactionsCardSkeleton />}>
                        <RecentTransactionsCard month={month} year={year} />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {(showBudgetProgress || showGoalProgress) && (
                    <div
                      className={cn(
                        "grid grid-cols-1 gap-4 sm:gap-6",
                        showBudgetProgress &&
                          showGoalProgress &&
                          "md:grid-cols-2",
                      )}
                    >
                      {showBudgetProgress && (
                        <ErrorBoundary>
                          <Suspense fallback={<BudgetProgressCardSkeleton />}>
                            <BudgetProgressCard month={month} year={year} />
                          </Suspense>
                        </ErrorBoundary>
                      )}
                      {showGoalProgress && (
                        <ErrorBoundary>
                          <Suspense fallback={<GoalProgressCardSkeleton />}>
                            <GoalProgressCard month={month} year={year} />
                          </Suspense>
                        </ErrorBoundary>
                      )}
                    </div>
                  )}
                </div>
              )}
              {showAside && (
                <aside
                  className={cn(
                    "flex flex-col gap-4 sm:gap-6",
                    !showMainColumn && "xl:col-span-3",
                  )}
                >
                  {showSubscriptions && (
                    <ErrorBoundary>
                      <Suspense fallback={<SubscriptionCardListSkeleton />}>
                        <SubscriptionCardList />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {showActivity && (
                    <ErrorBoundary>
                      <Suspense fallback={<ActivityFeedCardSkeleton />}>
                        <ActivityFeedCard month={month} year={year} />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                </aside>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
