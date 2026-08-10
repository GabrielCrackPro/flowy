"use client";

import {
  ActivityFeedCard,
  BudgetProgressCard,
  DashboardAlerts,
  DashboardHeader,
  DistributionCard,
  GoalProgressCard,
  InsightsCard,
  MonthPicker,
  RecentTransactionsCard,
  SubscriptionCardList,
} from "@components/dashboard";
import { ChartCardSkeleton } from "@components/dashboard/charts/chart-card";
import { StatsCardGroup } from "@components/shared";
import { ErrorBoundary } from "@components/shared/error-boundary";
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

  const showInsights = isCardEnabled("insights");
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
      <DashboardHeader month={month} year={year} />
      <DashboardAlerts month={month} year={year} />

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
        {showInsights && (
          <ErrorBoundary>
            <InsightsCard month={month} year={year} />
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
                      <DistributionCard month={month} year={year} />
                    </ErrorBoundary>
                  )}
                  {showRecentTransactions && (
                    <ErrorBoundary>
                      <RecentTransactionsCard month={month} year={year} />
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
                          <BudgetProgressCard month={month} year={year} />
                        </ErrorBoundary>
                      )}
                      {showGoalProgress && (
                        <ErrorBoundary>
                          <GoalProgressCard month={month} year={year} />
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
                      <SubscriptionCardList />
                    </ErrorBoundary>
                  )}
                  {showActivity && (
                    <ErrorBoundary>
                      <ActivityFeedCard month={month} year={year} />
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
