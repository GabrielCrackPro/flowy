"use client";

import { ChartToggle } from "@components/charts";
import {
  AnimatedNumber,
  EmptyState,
  Icon,
  SectionCard,
} from "@components/shared";
import type { ChartConfig } from "@components/ui";
import {
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@components/ui";
import { useBudgetApi } from "@hooks/api/useBudgetApi";
import { useGoalApi } from "@hooks/api/useGoalApi";
import { useChartLayers } from "@hooks/useChartLayers";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartArea,
  ChartColumn,
  ChartLine,
  ChevronRight,
  Settings2,
  TrendingUp,
} from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/types/Dashboard";
import {
  BALANCE_COLOR,
  buildInitialLayers,
  type ChartType,
  EXPENSE_COLOR,
  INCOME_COLOR,
  NET_COLOR,
  type TimePeriod,
} from "./cash-flow-constants";
import { CashFlowLegend } from "./cash-flow-legend";
import { renderSeries } from "./cash-flow-series";
import { CashFlowSettingsSheet } from "./cash-flow-settings-sheet";
import { ChartCardSkeleton } from "./chart-card";

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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const saved = localStorage.getItem("flowy-time-period");
    return saved === "week" || saved === "month"
      ? (saved as TimePeriod)
      : "month";
  });
  const [showOverlays, setShowOverlays] = useState<boolean>(
    () => localStorage.getItem("flowy-chart-overlays") === "true",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const defaultLayers = useMemo(() => buildInitialLayers(t), [t]);

  const initialLayers = useMemo(() => {
    try {
      const saved = localStorage.getItem("flowy-chart-layers");
      if (!saved) return defaultLayers;
      const visibleMap = JSON.parse(saved) as Record<string, boolean>;
      return defaultLayers.map((layer) => ({
        ...layer,
        visible: visibleMap[layer.id] ?? layer.visible,
      }));
    } catch {
      return defaultLayers;
    }
  }, [defaultLayers]);

  const { layers, handleLayerVisibilityChange, resetLayers } =
    useChartLayers(initialLayers);

  useEffect(() => {
    const visibleMap: Record<string, boolean> = {};
    for (const layer of layers) {
      visibleMap[layer.id] = layer.visible;
    }
    localStorage.setItem("flowy-chart-layers", JSON.stringify(visibleMap));
  }, [layers]);

  useEffect(() => {
    localStorage.setItem("flowy-chart-overlays", String(showOverlays));
  }, [showOverlays]);

  const resetSettings = () => {
    setChartType("area");
    localStorage.setItem("flowy-chart-type", "area");
    setTimePeriod("month");
    localStorage.setItem("flowy-time-period", "month");
    setShowOverlays(false);
    resetLayers(defaultLayers);
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
    <>
      <SectionCard
        icon={<Icon icon={ChartArea} className="size-5" />}
        title={getTitle()}
        description={getDescription()}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ChartToggle<ChartType>
              value={chartType}
              onChange={(type) => {
                setChartType(type);
                localStorage.setItem("flowy-chart-type", type);
              }}
              options={[
                { value: "area", label: t("charts.area"), icon: ChartArea },
                { value: "bar", label: t("charts.bar"), icon: ChartColumn },
                { value: "line", label: t("charts.line"), icon: ChartLine },
              ]}
              labelHiddenUntil="sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              aria-label={t("charts.configure")}
              className={cn(
                "rounded-xl border border-border/30 bg-card text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors",
                "hover:border-border/50 hover:text-foreground",
                settingsOpen &&
                  "border-primary/40 bg-primary/10 text-primary hover:border-primary/40 hover:text-primary",
              )}
            >
              <Icon icon={Settings2} className="size-3.5" />
            </Button>
          </div>
        }
      >
        {hasData && hasAnyLayerVisible ? (
          <div className="px-5 pb-6 sm:px-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-72 w-full sm:h-80"
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
                  content={(props) => (
                    <CashFlowLegend
                      payload={props.payload}
                      chartConfig={chartConfig}
                    />
                  )}
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

      <CashFlowSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        timePeriod={timePeriod}
        onTimePeriodChange={(period) => {
          setTimePeriod(period);
          localStorage.setItem("flowy-time-period", period);
        }}
        layers={layers}
        onLayerVisibilityChange={handleLayerVisibilityChange}
        showOverlays={showOverlays}
        onOverlaysChange={setShowOverlays}
        onReset={resetSettings}
      />
    </>
  );
}
