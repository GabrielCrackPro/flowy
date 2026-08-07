"use client";

import { ChartToggle } from "@components/charts";
import {
  AnimatedNumber,
  EmptyState,
  Icon,
  type IconProps,
  SectionCard,
} from "@components/shared";
import type { ChartConfig } from "@components/ui";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@components/ui";
import { useBudgetApi } from "@hooks/api/useBudgetApi";
import { useGoalApi } from "@hooks/api/useGoalApi";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import type { DashboardData } from "@/types/Dashboard";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpDown,
  Calendar,
  ChartArea,
  ChartColumn,
  ChartLine,
  Clock,
  TrendingUp,
  Wallet,
} from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import { ChartCardSkeleton } from "./chart-card";

type ChartType = "area" | "bar" | "line";
type DataView = "both" | "income" | "expenses" | "balance" | "net";
type TimePeriod = "week" | "month";

interface CashFlowChartProps {
  month: number;
  year: number;
}

export function CashFlowChart({ month, year }: CashFlowChartProps) {
  const { data: dashboard, isLoading } = useDashboardData(month, year);
  const stats = (dashboard as DashboardData)?.stats;
  const { budgets } = useBudgetApi();
  const { goals } = useGoalApi();
  const { profile } = useProfile();
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<ChartType>(
    (localStorage.getItem("flowy-chart-type") as ChartType) ?? "area",
  );
  const [dataView, setDataView] = useState<DataView>(
    (localStorage.getItem("flowy-data-view") as DataView) ?? "both",
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const saved = localStorage.getItem("flowy-time-period");
    return saved === "week" || saved === "month"
      ? (saved as TimePeriod)
      : "month";
  });
  const [showOverlays, setShowOverlays] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("flowy-collapsed-groups");
    return saved
      ? new Set(JSON.parse(saved))
      : new Set(["chartType", "dataView"]);
  });

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
    localStorage.setItem(
      "flowy-collapsed-groups",
      JSON.stringify([...newCollapsed]),
    );
  };

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const INCOME_COLOR = "#22c55e";
  const EXPENSE_COLOR = "#ef4444";
  const BALANCE_COLOR = "#3b82f6";
  const NET_COLOR = "#8b5cf6";

  const budgetLines = useMemo(() => {
    if (!showOverlays || !budgets || budgets.length === 0) return [];

    return budgets.slice(0, 3).map((budget) => ({
      y: budget.budgetLimit,
      label: budget.category?.name || t("charts.budget"),
      color: budget.category?.color || "#6366f1",
    }));
  }, [showOverlays, budgets, t]);

  const goalLines = useMemo(() => {
    if (!showOverlays || !goals || goals.length === 0) return [];

    return goals.slice(0, 2).map((goal) => ({
      y: goal.targetAmount,
      label: goal.title || t("charts.goal"),
      color: "#22c55e",
    }));
  }, [showOverlays, goals, t]);

  const chartConfig = useMemo(
    () =>
      ({
        income: { label: t("charts.income"), color: INCOME_COLOR },
        expenses: { label: t("charts.expenses"), color: EXPENSE_COLOR },
        balance: { label: t("charts.balance"), color: BALANCE_COLOR },
        net: { label: t("charts.net"), color: NET_COLOR },
      }) satisfies ChartConfig,
    [t],
  );

  const data = useMemo(() => {
    const dailyData = stats?.dailySeries ?? [];

    if (timePeriod === "week") {
      const last7Days = dailyData.slice(-7);
      return last7Days.map((point) => ({
        ...point,
        label: String(point.day),
        net: point.income - point.expenses,
      }));
    }

    if (timePeriod === "month") {
      return dailyData.map((point) => ({
        ...point,
        label: String(point.day),
        net: point.income - point.expenses,
      }));
    }

    return dailyData.map((point) => ({
      ...point,
      label: String(point.day),
      net: point.income - point.expenses,
    }));
  }, [stats, timePeriod]);

  const hasData = useMemo(() => {
    if (data.length === 0) return false;

    switch (dataView) {
      case "both":
        return data.some((point) => point.income || point.expenses);
      case "income":
        return data.some((point) => point.income > 0);
      case "expenses":
        return data.some((point) => point.expenses > 0);
      case "balance":
        return data.some((point) => point.balance !== 0);
      case "net":
        return data.some((point) => point.net !== 0);
      default:
        return data.some((point) => point.income || point.expenses);
    }
  }, [data, dataView]);

  const getEmptyMessage = () => {
    switch (dataView) {
      case "income":
        return {
          title: t("charts.noIncomeData"),
          description: t("charts.noIncomeDataDesc"),
        };
      case "expenses":
        return {
          title: t("charts.noExpenseData"),
          description: t("charts.noExpenseDataDesc"),
        };
      case "balance":
        return {
          title: t("charts.noBalanceData"),
          description: t("charts.noBalanceDataDesc"),
        };
      case "net":
        return {
          title: t("charts.noNetData"),
          description: t("charts.noNetDataDesc"),
        };
      default:
        return {
          title: t("charts.emptyTitle"),
          description: t("charts.emptyDescription"),
        };
    }
  };

  const getTitle = () => {
    const period = t(`charts.${timePeriod}`);
    return `${t("charts.cashFlow")} - ${period}`;
  };

  const getDescription = () => {
    switch (timePeriod) {
      case "week":
        return t("charts.cashFlowWeekDesc");
      case "month":
        return t("charts.cashFlowDesc");
      default:
        return t("charts.cashFlowDesc");
    }
  };

  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format,
    [locale],
  );

  const chartTypeTabs: {
    value: ChartType;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "area", label: t("charts.area"), icon: ChartArea },
    { value: "bar", label: t("charts.bar"), icon: ChartColumn },
    { value: "line", label: t("charts.line"), icon: ChartLine },
  ];

  const dataViewTabs: {
    value: DataView;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "both", label: t("charts.both"), icon: ArrowUpDown },
    { value: "income", label: t("charts.income"), icon: ArrowUpCircle },
    { value: "expenses", label: t("charts.expenses"), icon: ArrowDownCircle },
    { value: "balance", label: t("charts.balance"), icon: Wallet },
    { value: "net", label: t("charts.net"), icon: TrendingUp },
  ];

  const timePeriodTabs: {
    value: TimePeriod;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "week", label: t("charts.week"), icon: Clock },
    { value: "month", label: t("charts.month"), icon: Calendar },
  ];

  const tooltipFormatter = (value: unknown, name: unknown) => {
    const key = String(name);
    const color =
      key === "income"
        ? INCOME_COLOR
        : key === "expenses"
          ? EXPENSE_COLOR
          : key === "balance"
            ? BALANCE_COLOR
            : NET_COLOR;
    return (
      <div className="flex w-full items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="size-2.5 shrink-0 rounded-xs"
            style={{ backgroundColor: color }}
          />
          {key === "income"
            ? t("charts.income")
            : key === "expenses"
              ? t("charts.expenses")
              : key === "balance"
                ? t("charts.balance")
                : t("charts.net")}
        </span>
        <span className="font-medium tabular-nums text-foreground">
          <AnimatedNumber
            value={Number(value)}
            formatter={(v) => formatCurrency(v, locale, currency)}
          />
        </span>
      </div>
    );
  };

  if (isLoading) {
    return <ChartCardSkeleton />;
  }

  return (
    <SectionCard
      icon={<Icon icon={ChartArea} className="size-5" />}
      title={getTitle()}
      description={getDescription()}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ChartToggle<TimePeriod>
            value={timePeriod}
            onChange={(period) => {
              setTimePeriod(period);
              localStorage.setItem("flowy-time-period", period);
            }}
            options={timePeriodTabs}
            groupIcon={Clock}
            collapsible
            collapsed={collapsedGroups.has("timePeriod")}
            onCollapseToggle={() => toggleGroup("timePeriod")}
            labelHiddenUntil="md"
          />
          <ChartToggle<ChartType>
            value={chartType}
            onChange={(type) => {
              setChartType(type);
              localStorage.setItem("flowy-chart-type", type);
            }}
            options={chartTypeTabs}
            groupIcon={ChartArea}
            collapsible
            collapsed={collapsedGroups.has("chartType")}
            onCollapseToggle={() => toggleGroup("chartType")}
          />
          <ChartToggle<DataView>
            value={dataView}
            onChange={(view) => {
              setDataView(view);
              localStorage.setItem("flowy-data-view", view);
            }}
            options={dataViewTabs}
            groupIcon={ArrowUpDown}
            collapsible
            collapsed={collapsedGroups.has("dataView")}
            onCollapseToggle={() => toggleGroup("dataView")}
            labelHiddenUntil="md"
          />
          <motion.button
            type="button"
            onClick={() => setShowOverlays(!showOverlays)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            aria-pressed={showOverlays}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors duration-200",
              showOverlays
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/30 bg-card text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-primary/30 hover:text-foreground",
            )}
          >
            <AnimatePresence>
              {showOverlays ? (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="size-1.5 rounded-full bg-primary"
                />
              ) : null}
            </AnimatePresence>
            <Icon icon={TrendingUp} className="size-3.5" />
            <span className="hidden sm:inline">{t("charts.overlays")}</span>
          </motion.button>
        </div>
      }
    >
      {hasData ? (
        <div className="px-5 pb-6 sm:px-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-80 w-full"
          >
            <ComposedChart
              data={data}
              margin={{ left: 12, right: 12, top: 40, bottom: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(value: number) => compactFormatter(value)}
              />
              <ChartTooltip
                cursor
                content={<ChartTooltipContent formatter={tooltipFormatter} />}
              />
              <Legend
                verticalAlign="top"
                height={36}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  return (
                    <div className="flex items-center gap-4">
                      {payload.map(
                        (entry: {
                          value?: string | number;
                          color?: string;
                        }) => {
                          const key = String(
                            entry.value,
                          ) as keyof typeof chartConfig;
                          const label =
                            chartConfig[key]?.label ?? String(entry.value);
                          return (
                            <div
                              key={`${entry.value}-${entry.color}`}
                              className="flex items-center gap-1.5"
                            >
                              <div
                                className="size-3 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {label}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  );
                }}
              />
              {showOverlays &&
                budgetLines.map((budget) => (
                  <ReferenceLine
                    key={`budget-${budget.label}-${budget.y}`}
                    y={budget.y}
                    stroke={budget.color}
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: budget.label,
                      position: "insideTopRight",
                      fill: budget.color,
                      fontSize: 10,
                    }}
                  />
                ))}
              {showOverlays &&
                goalLines.map((goal) => (
                  <ReferenceLine
                    key={`goal-${goal.label}-${goal.y}`}
                    y={goal.y}
                    stroke={goal.color}
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{
                      value: goal.label,
                      position: "insideTopLeft",
                      fill: goal.color,
                      fontSize: 10,
                    }}
                  />
                ))}
              {dataView === "both" ? (
                <>
                  {chartType === "area" ? (
                    <>
                      <Area
                        dataKey="income"
                        type="monotone"
                        fill={INCOME_COLOR}
                        fillOpacity={0.2}
                        stroke={INCOME_COLOR}
                        strokeWidth={2}
                      />
                      <Area
                        dataKey="expenses"
                        type="monotone"
                        fill={EXPENSE_COLOR}
                        fillOpacity={0.2}
                        stroke={EXPENSE_COLOR}
                        strokeWidth={2}
                      />
                    </>
                  ) : null}
                  {chartType === "bar" ? (
                    <>
                      <Bar
                        dataKey="income"
                        fill={INCOME_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        fill={EXPENSE_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                    </>
                  ) : null}
                  {chartType === "line" ? (
                    <>
                      <Line
                        dataKey="income"
                        type="monotone"
                        stroke={INCOME_COLOR}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        dataKey="expenses"
                        type="monotone"
                        stroke={EXPENSE_COLOR}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </>
                  ) : null}
                </>
              ) : null}
              {dataView === "income" ? (
                <>
                  {chartType === "area" ? (
                    <Area
                      dataKey="income"
                      type="monotone"
                      fill={INCOME_COLOR}
                      fillOpacity={0.3}
                      stroke={INCOME_COLOR}
                      strokeWidth={2}
                    />
                  ) : null}
                  {chartType === "bar" ? (
                    <Bar
                      dataKey="income"
                      fill={INCOME_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  ) : null}
                  {chartType === "line" ? (
                    <Line
                      dataKey="income"
                      type="monotone"
                      stroke={INCOME_COLOR}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ) : null}
                </>
              ) : null}
              {dataView === "expenses" ? (
                <>
                  {chartType === "area" ? (
                    <Area
                      dataKey="expenses"
                      type="monotone"
                      fill={EXPENSE_COLOR}
                      fillOpacity={0.3}
                      stroke={EXPENSE_COLOR}
                      strokeWidth={2}
                    />
                  ) : null}
                  {chartType === "bar" ? (
                    <Bar
                      dataKey="expenses"
                      fill={EXPENSE_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  ) : null}
                  {chartType === "line" ? (
                    <Line
                      dataKey="expenses"
                      type="monotone"
                      stroke={EXPENSE_COLOR}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ) : null}
                </>
              ) : null}
              {dataView === "balance" ? (
                <>
                  {chartType === "area" ? (
                    <Area
                      dataKey="balance"
                      type="monotone"
                      fill={BALANCE_COLOR}
                      fillOpacity={0.3}
                      stroke={BALANCE_COLOR}
                      strokeWidth={2}
                    />
                  ) : null}
                  {chartType === "bar" ? (
                    <Bar
                      dataKey="balance"
                      fill={BALANCE_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  ) : null}
                  {chartType === "line" ? (
                    <Line
                      dataKey="balance"
                      type="monotone"
                      stroke={BALANCE_COLOR}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ) : null}
                </>
              ) : null}
              {dataView === "net" ? (
                <>
                  {chartType === "area" ? (
                    <Area
                      dataKey="net"
                      type="monotone"
                      fill={NET_COLOR}
                      fillOpacity={0.3}
                      stroke={NET_COLOR}
                      strokeWidth={2}
                    />
                  ) : null}
                  {chartType === "bar" ? (
                    <Bar dataKey="net" fill={NET_COLOR} radius={[4, 4, 0, 0]} />
                  ) : null}
                  {chartType === "line" ? (
                    <Line
                      dataKey="net"
                      type="monotone"
                      stroke={NET_COLOR}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ) : null}
                </>
              ) : null}
            </ComposedChart>
          </ChartContainer>
        </div>
      ) : (
        <EmptyState
          icon={<Icon icon={TrendingUp} className="size-5" />}
          title={getEmptyMessage().title}
          description={getEmptyMessage().description}
        />
      )}
    </SectionCard>
  );
}
