"use client";

import {
  Animated,
  AnimatedNumber,
  Icon,
  type IconProps,
} from "@components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui";
import { useProfile } from "@hooks/useProfile";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "@/lib/icons";

import { cn, formatCount, formatCurrency, formatPercentage } from "@/lib/utils";
import { CARD_BG_GRADIENT, CARD_SHELL, CARD_TOP_ACCENT } from "./card-tokens";

export type StatsCardVariant = "currency" | "percentage" | "count";

export type StatsCardTone =
  | "default"
  | "positive"
  | "negative"
  | "info"
  | "warning";

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: ReactNode;
  variant?: StatsCardVariant;
  icon?: IconProps["icon"];
  tone?: StatsCardTone;
  trend?: {
    value: number;
    label?: string;
  };
}

const toneAccentClasses: Record<StatsCardTone, string> = {
  default:
    "bg-gradient-to-br from-primary/20 to-primary/10 text-primary dark:from-primary/30 dark:to-primary/20 shadow-md shadow-primary/20",
  positive:
    "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400 shadow-md shadow-emerald-500/20",
  negative:
    "bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400 shadow-md shadow-rose-500/20",
  info: "bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400 shadow-md shadow-blue-500/20",
  warning:
    "bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 dark:from-amber-500/30 dark:to-amber-500/20 dark:text-amber-400 shadow-md shadow-amber-500/20",
};

const toneBorderClasses: Record<StatsCardTone, string> = {
  default: "from-primary via-primary to-primary",
  positive: "from-emerald-500 via-emerald-400 to-emerald-500",
  negative: "from-rose-500 via-rose-400 to-rose-500",
  info: "from-blue-500 via-blue-400 to-blue-500",
  warning: "from-amber-500 via-amber-400 to-amber-500",
};

const toneValueClasses: Record<StatsCardTone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
  info: "text-foreground",
  warning: "text-foreground",
};

const toneBgClasses: Record<StatsCardTone, string> = {
  default: "from-primary/8 via-primary/[0.03] to-transparent",
  positive: "from-emerald-500/8 via-emerald-500/[0.03] to-transparent",
  negative: "from-rose-500/8 via-rose-500/[0.03] to-transparent",
  info: "from-blue-500/8 via-blue-500/[0.03] to-transparent",
  warning: "from-amber-500/8 via-amber-500/[0.03] to-transparent",
};

function resolveTone(
  explicit: StatsCardTone | undefined,
  variant: StatsCardVariant,
  value: number,
): StatsCardTone {
  if (explicit) return explicit;

  if (variant === "currency") {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
  }

  return "default";
}

function getFormatter(
  variant: StatsCardVariant,
  locale: string,
  currency: string,
) {
  switch (variant) {
    case "currency":
      return (v: number) => formatCurrency(v, locale, currency);
    case "percentage":
      return (v: number) => {
        // If value is between 0-1, treat as decimal and convert to percentage
        const percentageValue = v <= 1 ? v * 100 : v;
        return formatPercentage(percentageValue, locale);
      };
    default:
      return (v: number) => formatCount(v, locale);
  }
}

export function StatsCard({
  title,
  value,
  description,
  variant = "currency",
  icon: IconComponent,
  tone: explicitTone,
  trend,
}: StatsCardProps) {
  const { profile } = useProfile();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const numericValue = typeof value === "number" ? value : Number(value) || 0;

  const tone = resolveTone(explicitTone, variant, numericValue);

  // Convert to percentage if value is between 0-1 (decimal) instead of 0-100
  const percentageValue = numericValue <= 1 ? numericValue * 100 : numericValue;

  const TrendIcon = trend && trend.value >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Animated.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group"
    >
      <Card
        className={cn(
          CARD_SHELL,
          "relative h-full gap-0 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
        )}
      >
        {/* Background gradient */}
        <div className={cn(CARD_BG_GRADIENT, toneBgClasses[tone])} />

        {/* Top gradient border */}
        <div className={cn(CARD_TOP_ACCENT, toneBorderClasses[tone])} />

        <CardHeader className="relative flex flex-row items-center justify-between px-5 pb-3 pt-5">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            {title}
          </CardTitle>

          {IconComponent && (
            <Animated.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform",
                toneAccentClasses[tone],
              )}
            >
              <Icon icon={IconComponent} className="size-5" />
            </Animated.div>
          )}
        </CardHeader>

        <CardContent className="relative flex flex-1 flex-col px-5 pb-5 pt-2">
          {/* Main Value */}
          <Animated.p
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cn(
              "text-3xl font-bold leading-none tracking-tight sm:text-4xl",
              toneValueClasses[tone],
            )}
          >
            <AnimatedNumber
              value={numericValue}
              formatter={getFormatter(variant, locale, currency)}
            />
          </Animated.p>

          {/* Description/Label */}
          {description && (
            <Animated.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="mt-2 text-sm leading-snug text-muted-foreground/70"
            >
              {description}
            </Animated.p>
          )}

          {/* Footer Section */}
          <div className="mt-auto pt-4">
            <div className="mb-3 border-t border-border/30" />
            <div className="flex items-center justify-between">
              {/* Trend Indicator */}
              {trend ? (
                <div className="flex items-center gap-2">
                  <Animated.div
                    whileHover={{
                      scale: 1.1,
                      rotate: trend.value >= 0 ? 10 : -10,
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{
                      duration: 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-lg transition-transform",
                      trend.value >= 0
                        ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400 shadow-sm shadow-emerald-500/20"
                        : "bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400 shadow-sm shadow-rose-500/20",
                    )}
                  >
                    <Icon icon={TrendIcon} className="size-3.5" />
                  </Animated.div>

                  <div className="flex flex-col">
                    <Animated.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className={cn(
                        "text-sm font-semibold leading-none",
                        trend.value >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {formatPercentage(Math.abs(trend.value), locale, 1)}
                    </Animated.span>
                    {trend.label && (
                      <Animated.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="text-xs text-muted-foreground/60"
                      >
                        {trend.label}
                      </Animated.span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {IconComponent && (
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-lg",
                        toneAccentClasses[tone],
                      )}
                    >
                      <Icon icon={IconComponent} className="size-3.5" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground/60">
                    {variant === "currency"
                      ? currency
                      : variant === "percentage"
                        ? "%"
                        : "items"}
                  </span>
                </div>
              )}

              {/* Progress indicator for percentage cards */}
              {variant === "percentage" && (
                <div className="flex items-center gap-2">
                  <div className="relative h-2 w-16 overflow-hidden rounded-full bg-muted/50 shadow-inner">
                    <Animated.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, Math.max(0, percentageValue))}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: 0.2,
                        ease: "easeOut",
                      }}
                      className={cn(
                        "h-full rounded-full shadow-sm",
                        toneBorderClasses[tone],
                      )}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground/70">
                    {Math.round(Math.min(100, Math.max(0, percentageValue)))}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Animated.div>
  );
}
