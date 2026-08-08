"use client";

import type { ChartLayer } from "@components/charts";
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
import { useChartLayers } from "@hooks/useChartLayers";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
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
  Calendar,
  ChartArea,
  ChartColumn,
  ChartLine,
  ChevronRight,
  Clock,
  Layers,
  TrendingUp,
} from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/types/Dashboard";
import { ChartCardSkeleton } from "./chart-card";

type ChartType = "area" | "bar" | "line";
type TimePeriod = "week" | "month";

const INCOME_COLOR = "#22c55e";
const EXPENSE_COLOR = "#ef4444";
const BALANCE_COLOR = "#3b82f6";
const NET_COLOR = "#8b5cf6";

interface CashFlowChartProps {
  month: number;
  year: number;
}

function buildInitialLayers(t: (key: string) => string): ChartLayer[] {
  return [
    {
      id: "income",
      name: t("charts.income"),
      type: "area",
      visible: true,
      color: INCOME_COLOR,
      dataKey: "income",
    },
    {
      id: "expenses",
      name: t("charts.expenses"),
      type: "area",
      visible: true,
      color: EXPENSE_COLOR,
      dataKey: "expenses",
    },
    {
      id: "balance",
      name: t("charts.balance"),
      type: "line",
      visible: false,
      color: BALANCE_COLOR,
      dataKey: "balance",
    },
    {
      id: "net",
      name: t("charts.net"),
      type: "line",
      visible: false,
      color: NET_COLOR,
      dataKey: "net",
    },
  ];
}

function renderSeries(layer: ChartLayer, chartType: ChartType) {
  const { dataKey, color } = layer;
  if (!dataKey) return null;

  const fillOpacity = chartType === "area" ? 0.2 : undefined;

  if (chartType === "area") {
    return (
      <Area
        key={layer.id}
        dataKey={dataKey}
        type="monotone"
        fill={color}
        fillOpacity={fillOpacity}
        stroke={color}
        strokeWidth={2}
      />
    );
  }

  if (chartType === "bar") {
    return (
      <Bar
        key={layer.id}
        dataKey={dataKey}
        fill={color}
        radius={[4, 4, 0, 0]}
      />
    );
  }

  return (
    <Line
      key={layer.id}
      dataKey={dataKey}
      type="monotone"
      stroke={color}
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 4 }}
    />
  );
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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const saved = localStorage.getItem("flowy-time-period");
    return saved === "week" || saved === "month"
      ? (saved as TimePeriod)
      : "month";
  });
  const [showOverlays, setShowOverlays] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("flowy-collapsed-groups");
    return saved ? new Set(JSON.parse(saved)) : new Set(["chartType"]);
  });

  const { layers, handleLayerVisibilityChange } = useChartLayers(
    buildInitialLayers(t),
  );

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

  const visibleLayers = layers.filter((l) => l.visible);
  const hasAnyLayerVisible = visibleLayers.length > 0;

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

    return dailyData.map((point) => ({
      ...point,
      label: String(point.day),
      net: point.income - point.expenses,
    }));
  }, [stats, timePeriod]);

  const hasData =
    data.length > 0 &&
    data.some((point) =>
      visibleLayers.some((layer) => {
        const val = point[layer.dataKey as keyof typeof point];
        return typeof val === "number" && val !== 0;
      }),
    );

  const getTitle = () => {
    const period = t(`charts.${timePeriod}`);
    return `${t("charts.cashFlow")} - ${period}`;
  };

  const getDescription = () => {
    switch (timePeriod) {
      case "week":
        return t("charts.cashFlowWeekDesc");
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

  const timePeriodTabs: {
    value: TimePeriod;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "week", label: t("charts.week"), icon: Clock },
    { value: "month", label: t("charts.month"), icon: Calendar },
  ];

  const layersCollapsed = collapsedGroups.has("layers");

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

          {/* Inline layers multi-toggle — matches ChartToggle style */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-card p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <motion.button
              type="button"
              onClick={() => toggleGroup("layers")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-expanded={!layersCollapsed}
              className="flex items-center gap-1.5 rounded-lg py-1.5 pr-1.5 pl-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              <Icon icon={Layers} className="size-3.5" />
              <motion.span
                animate={{ rotate: layersCollapsed ? 0 : 90 }}
                transition={{ duration: 0.2 }}
                className="flex"
              >
                <Icon icon={ChevronRight} className="size-3" />
              </motion.span>
            </motion.button>

            <AnimatePresence initial={false}>
              {!layersCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-0.5 overflow-hidden"
                >
                  {layers.map((layer) => {
                    const active = layer.visible;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() =>
                          handleLayerVisibilityChange(layer.id, !layer.visible)
                        }
                        aria-pressed={active}
                        title={layer.name}
                        className={cn(
                          "relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/40 hover:bg-muted/60",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground/60",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="layer-active-pill"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 32,
                            }}
                            className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/20"
                          />
                        )}
                        <span
                          className="relative z-10 size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="relative z-10 hidden sm:inline">
                          {layer.name}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
      {hasData && hasAnyLayerVisible ? (
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
              {visibleLayers.map((layer) => renderSeries(layer, chartType))}
            </ComposedChart>
          </ChartContainer>
        </div>
      ) : (
        <EmptyState
          icon={<Icon icon={TrendingUp} size="lg" />}
          title={
            hasAnyLayerVisible
              ? t("charts.emptyTitle")
              : t("charts.allSeriesHidden")
          }
          description={
            hasAnyLayerVisible
              ? t("charts.emptyDescription")
              : t("charts.allSeriesHiddenDesc")
          }
          iconClassName="from-blue-500/20 to-blue-500/10 text-blue-600 ring-blue-500/10 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400"
          action={
            <Link
              href="/dashboard/transactions/add"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("nav.newTransaction")}
              <Icon icon={ChevronRight} className="size-3.5" />
            </Link>
          }
        />
      )}
    </SectionCard>
  );
}
