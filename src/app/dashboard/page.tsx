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
import { MfaGate } from "@/components/auth/mfa-gate";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import { useDashboardOrder } from "@/hooks/useDashboardOrder";
import {
  DASHBOARD_REGIONS,
  type DashboardCardId,
  orderForRegion,
} from "@/lib/dashboard-cards";
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

function regionCards(id: string): readonly DashboardCardId[] {
  return DASHBOARD_REGIONS.find((region) => region.id === id)?.cards ?? [];
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { isCardEnabled } = useDashboardCards();
  const { order } = useDashboardOrder();

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

  const summaryOrder = orderForRegion(order, regionCards("summary")).filter(
    isCardEnabled,
  );
  const chartOrder = orderForRegion(order, regionCards("charts")).filter(
    isCardEnabled,
  );
  const mainOrder = orderForRegion(order, regionCards("main")).filter(
    isCardEnabled,
  );
  const asideOrder = orderForRegion(order, regionCards("aside")).filter(
    isCardEnabled,
  );

  const showCashFlow = chartOrder.includes("cashFlow");
  const showExpenseDistribution = chartOrder.includes("expenseDistribution");
  const showCharts = chartOrder.length > 0;
  const showMainColumn = mainOrder.length > 0;
  const showAside = asideOrder.length > 0;
  const showAnalysis = showCharts || showMainColumn || showAside;

  // Pair budget + goal progress side by side only when they are adjacent in
  // the stored order; otherwise each renders full-width in the main column.
  const mainSlots: { ids: DashboardCardId[] }[] = [];
  for (const id of mainOrder) {
    const last = mainSlots[mainSlots.length - 1];
    const sibling =
      last &&
      last.ids.length === 1 &&
      ((last.ids[0] === "budgetProgress" && id === "goalProgress") ||
        (last.ids[0] === "goalProgress" && id === "budgetProgress"));
    if (sibling) {
      last.ids.push(id);
    } else {
      mainSlots.push({ ids: [id] });
    }
  }

  const renderMainCard = (id: DashboardCardId) => {
    switch (id) {
      case "distribution":
        return (
          <ErrorBoundary key="distribution">
            <DistributionCard month={month} year={year} />
          </ErrorBoundary>
        );
      case "recentTransactions":
        return (
          <ErrorBoundary key="recentTransactions">
            <RecentTransactionsCard month={month} year={year} />
          </ErrorBoundary>
        );
      case "budgetProgress":
        return (
          <ErrorBoundary key="budgetProgress">
            <BudgetProgressCard month={month} year={year} />
          </ErrorBoundary>
        );
      case "goalProgress":
        return (
          <ErrorBoundary key="goalProgress">
            <GoalProgressCard month={month} year={year} />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <MfaGate>
      <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        <DashboardHeader month={month} year={year} />
        <DashboardAlerts month={month} year={year} />

        <section className="space-y-6">
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
          {summaryOrder.map((id) =>
            id === "stats" ? (
              <ErrorBoundary key="stats">
                <StatsCardGroup month={month} year={year} />
              </ErrorBoundary>
            ) : (
              <ErrorBoundary key="insights">
                <InsightsCard month={month} year={year} />
              </ErrorBoundary>
            ),
          )}
        </section>

        {showAnalysis && (
          <section className="space-y-6">
            <SectionHeading
              title={t("dashboard.analysis")}
              description={t("dashboard.analysisDesc")}
            />

            {showCharts && (
              <div
                className={cn(
                  "grid grid-cols-1 gap-5 sm:gap-6",
                  showCashFlow && showExpenseDistribution && "xl:grid-cols-3",
                )}
              >
                {chartOrder.map((id) =>
                  id === "cashFlow" ? (
                    <div
                      key="cashFlow"
                      className={cn(showExpenseDistribution && "xl:col-span-2")}
                    >
                      <ErrorBoundary>
                        <Suspense fallback={<ChartCardSkeleton />}>
                          <CashFlowChart month={month} year={year} />
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                  ) : (
                    <div key="expenseDistribution">
                      <ErrorBoundary>
                        <Suspense fallback={<ChartCardSkeleton />}>
                          <ExpenseDistributionChart month={month} year={year} />
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                  ),
                )}
              </div>
            )}

            {(showMainColumn || showAside) && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
                {showMainColumn && (
                  <div
                    className={cn(
                      "flex flex-col gap-5 sm:gap-6",
                      showAside ? "xl:col-span-2" : "xl:col-span-3",
                    )}
                  >
                    {mainSlots.map((slot) =>
                      slot.ids.length === 2 ? (
                        <div
                          key={slot.ids.join("-")}
                          className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2"
                        >
                          {slot.ids.map((id) => renderMainCard(id))}
                        </div>
                      ) : (
                        renderMainCard(slot.ids[0])
                      ),
                    )}
                  </div>
                )}
                {showAside && (
                  <aside
                    className={cn(
                      "flex flex-col gap-5 sm:gap-6",
                      !showMainColumn && "xl:col-span-3",
                    )}
                  >
                    {asideOrder.map((id) =>
                      id === "subscriptions" ? (
                        <ErrorBoundary key="subscriptions">
                          <SubscriptionCardList />
                        </ErrorBoundary>
                      ) : (
                        <ErrorBoundary key="activity">
                          <ActivityFeedCard month={month} year={year} />
                        </ErrorBoundary>
                      ),
                    )}
                  </aside>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </MfaGate>
  );
}
