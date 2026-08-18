"use client";

import {
  AnimatedNumber,
  EmptyState,
  Icon,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart } from "recharts";
import { ArrowRight, ChartPie } from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/types/Dashboard";
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

interface ExpenseDistributionChartProps {
  month: number;
  year: number;
}

export function ExpenseDistributionChart({
  month,
  year,
}: ExpenseDistributionChartProps) {
  const { data: dashboard, isLoading } = useDashboardData(month, year);
  const stats = (dashboard as DashboardData)?.stats;
  const { profile } = useProfile();
  const { t } = useTranslation();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const data = useMemo(() => {
    const baseData = stats?.expensesByCategory ?? [];
    return baseData.map((item, index) => ({
      name: item.name === OTHER_CATEGORY_KEY ? t("charts.other") : item.name,
      value: item.amount,
      fill: PALETTE[index % PALETTE.length],
    }));
  }, [stats, t]);

  const hasData = data.some((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Shrink the center amount as it grows so it stays inside the donut hole
  // (inner radius 62px) instead of overlapping the rings; truncate is the
  // last-resort guard for extreme amounts.
  const sizeClassFor = (label: string) =>
    label.length <= 10
      ? "text-lg"
      : label.length <= 12
        ? "text-base"
        : "text-sm";

  const activeItem = activeIndex !== null ? data[activeIndex] : undefined;
  const centerValue = activeItem?.value ?? total;
  const centerLabel = formatCurrency(centerValue, locale, currency);
  const centerSizeClass = sizeClassFor(centerLabel);
  const activePercent =
    activeItem && total > 0
      ? Math.round((activeItem.value / total) * 100)
      : null;

  const handleSliceClick = (categoryName: string) => {
    if (categoryName === t("charts.other")) return;
    const params = new URLSearchParams({ category: categoryName });
    router.push(`/dashboard/transactions?${params.toString()}`);
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

  if (isLoading) {
    return <ChartCardSkeleton />;
  }

  return (
    <SectionCard
      icon={<Icon icon={ChartPie} className="size-5" />}
      title={t("charts.expensesByCategory")}
      description={t("charts.expensesByCategoryDesc")}
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
                  onClick={(entry) => handleSliceClick(entry.name)}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className="cursor-pointer"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                      className={cn(
                        "transition-opacity duration-200",
                        activeIndex !== null &&
                          activeIndex !== index &&
                          "opacity-40",
                      )}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="max-w-[7rem] truncate text-xs text-muted-foreground">
                {activeItem ? activeItem.name : t("charts.expenses")}
              </span>
              <span
                title={centerLabel}
                className={cn(
                  "mt-0.5 max-w-[7rem] truncate font-semibold tabular-nums",
                  centerSizeClass,
                )}
              >
                <AnimatedNumber
                  value={centerValue}
                  formatter={(v) => formatCurrency(v, locale, currency)}
                />
              </span>
              {activePercent !== null && (
                <span className="mt-0.5 text-[10px] font-medium tabular-nums text-muted-foreground/70">
                  {activePercent}%
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-1">
            {data.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleSliceClick(item.name)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  activeIndex === index ? "bg-muted/60" : "hover:bg-muted/40",
                )}
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
              </button>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Icon icon={ChartPie} size="lg" />}
          title={t("charts.emptyTitle")}
          description={t("charts.emptyDescription")}
          iconClassName="from-violet-500/20 to-violet-500/10 text-violet-600 ring-violet-500/10 dark:from-violet-500/30 dark:to-violet-500/20 dark:text-violet-400"
          action={
            <Link
              href="/dashboard/transactions/add"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("nav.newTransaction")}
              <Icon icon={ArrowRight} className="size-3.5" />
            </Link>
          }
        />
      )}
    </SectionCard>
  );
}
