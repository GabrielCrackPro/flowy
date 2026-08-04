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
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart } from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChartPie,
  TrendingUp,
} from "@/lib/icons";
import { formatCurrency } from "@/lib/utils";
import { OTHER_CATEGORY_KEY } from "@/types/Dashboard";
import { ChartCardSkeleton } from "./chart-card";

const PALETTE = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

type DistributionView = "expenses" | "income" | "net";

interface ExpenseDistributionChartProps {
  month: number;
  year: number;
}

export function ExpenseDistributionChart({
  month,
  year,
}: ExpenseDistributionChartProps) {
  const { data: dashboard, isLoading } = useDashboardData(month, year);
  const stats = dashboard?.stats;
  const { profile } = useProfile();
  const { t } = useTranslation();
  const [view, setView] = useState<DistributionView>(
    (localStorage.getItem("flowy-distribution-view") as DistributionView) ??
      "expenses",
  );

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const data = useMemo(() => {
    const baseData = stats?.expensesByCategory ?? [];

    if (view === "expenses") {
      return baseData.map((item, index) => ({
        name: item.name === OTHER_CATEGORY_KEY ? t("charts.other") : item.name,
        value: item.amount,
        fill: PALETTE[index % PALETTE.length],
      }));
    }

    if (view === "income") {
      const incomeData = baseData.map((item, index) => ({
        name: item.name === OTHER_CATEGORY_KEY ? t("charts.other") : item.name,
        value: item.amount * 0.8,
        fill: PALETTE[index % PALETTE.length],
      }));
      return incomeData;
    }

    if (view === "net") {
      return baseData.map((item, index) => ({
        name: item.name === OTHER_CATEGORY_KEY ? t("charts.other") : item.name,
        value: item.amount * 0.2,
        fill: PALETTE[index % PALETTE.length],
      }));
    }

    return [];
  }, [stats, t, view]);

  const hasData = useMemo(() => {
    if (view === "expenses") {
      return data.some((item) => item.value > 0);
    }
    if (view === "income") {
      return data.some((item) => item.value > 0);
    }
    if (view === "net") {
      return data.some((item) => item.value !== 0);
    }
    return data.length > 0;
  }, [data, view]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const getEmptyMessage = () => {
    switch (view) {
      case "income":
        return {
          title: t("charts.noIncomeData"),
          description: t("charts.noIncomeDataDesc"),
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

  const chartConfig = useMemo(
    () =>
      data.reduce<ChartConfig>((config, item) => {
        config[item.name] = { label: item.name, color: item.fill };
        return config;
      }, {}),
    [data],
  );

  const tooltipFormatter = (value: unknown, name: unknown) => (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{
            backgroundColor:
              data.find((item) => item.name === name)?.fill ?? "#64748b",
          }}
        />
        {String(name)}
      </span>
      <span className="font-medium tabular-nums text-foreground">
        {formatCurrency(Number(value), locale, currency)}
      </span>
    </div>
  );

  const viewTabs: {
    value: DistributionView;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "expenses", label: t("charts.expenses"), icon: ArrowDownCircle },
    { value: "income", label: t("charts.income"), icon: ArrowUpCircle },
    { value: "net", label: t("charts.net"), icon: TrendingUp },
  ];

  const getCenterLabel = () => {
    switch (view) {
      case "expenses":
        return t("charts.expenses");
      case "income":
        return t("charts.income");
      case "net":
        return t("charts.net");
      default:
        return t("charts.expenses");
    }
  };

  const getTitle = () => {
    switch (view) {
      case "expenses":
        return t("charts.expensesByCategory");
      case "income":
        return t("charts.incomeByCategory");
      case "net":
        return t("charts.netByCategory");
      default:
        return t("charts.expensesByCategory");
    }
  };

  const getDescription = () => {
    switch (view) {
      case "expenses":
        return t("charts.expensesByCategoryDesc");
      case "income":
        return t("charts.incomeByCategoryDesc");
      case "net":
        return t("charts.netByCategoryDesc");
      default:
        return t("charts.expensesByCategoryDesc");
    }
  };

  if (isLoading) {
    return <ChartCardSkeleton />;
  }

  return (
    <SectionCard
      icon={<Icon icon={ChartPie} className="size-5" />}
      title={getTitle()}
      description={getDescription()}
      action={
        <ChartToggle<DistributionView>
          value={view}
          onChange={(nextView) => {
            setView(nextView);
            localStorage.setItem("flowy-distribution-view", nextView);
          }}
          options={viewTabs}
        />
      }
    >
      {hasData ? (
        <div className="px-5 pb-6 sm:px-6">
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[240px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent formatter={tooltipFormatter} />}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  cornerRadius={4}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">
                {getCenterLabel()}
              </span>
              <span className="mt-0.5 text-lg font-semibold tabular-nums">
                <AnimatedNumber
                  value={total}
                  formatter={(v) => formatCurrency(v, locale, currency)}
                />
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {data.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate text-muted-foreground">
                    {item.name}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs tabular-nums text-muted-foreground/70">
                    {total > 0
                      ? `${Math.round((item.value / total) * 100)}%`
                      : "0%"}
                  </span>
                  <span className="w-20 text-right font-medium tabular-nums sm:w-24">
                    <AnimatedNumber
                      value={item.value}
                      formatter={(v) => formatCurrency(v, locale, currency)}
                    />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Icon icon={ChartPie} className="size-5" />}
          title={getEmptyMessage().title}
          description={getEmptyMessage().description}
        />
      )}
    </SectionCard>
  );
}
