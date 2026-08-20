"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui";
import { useProfile } from "@hooks/useProfile";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownRight, ArrowUpRight } from "@/lib/icons";
import { cn, formatCount, formatCurrency, formatPercentage } from "@/lib/utils";
import { Animated } from "./animated-component";
import { AnimatedNumber } from "./animated-number";
import { CARD_BG_GRADIENT, CARD_SHELL, CARD_TOP_ACCENT } from "./card-tokens";
import { Icon, type IconProps } from "./icon";

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
    invert?: boolean;
  };
  /** When set, the card becomes a link to this route. */
  href?: string;
}

const toneAccentClasses: Record<StatsCardTone, string> = {
  default:
    "bg-primary/10 text-primary ring-1 ring-inset ring-primary/10 dark:bg-primary/15 dark:text-primary",
  positive:
    "bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/10 dark:bg-emerald-500/15 dark:text-emerald-400",
  negative:
    "bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/10 dark:bg-rose-500/15 dark:text-rose-400",
  info: "bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/10 dark:bg-blue-500/15 dark:text-blue-400",
  warning:
    "bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/10 dark:bg-amber-500/15 dark:text-amber-400",
};

const toneGlowClasses: Record<StatsCardTone, string> = {
  default: "bg-primary/15 dark:bg-primary/20",
  positive: "bg-emerald-500/15 dark:bg-emerald-500/20",
  negative: "bg-rose-500/15 dark:bg-rose-500/20",
  info: "bg-blue-500/15 dark:bg-blue-500/20",
  warning: "bg-amber-500/15 dark:bg-amber-500/20",
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
        const percentageValue = v > 0 && v <= 1 ? v * 100 : v;
        return formatPercentage(percentageValue, locale, 2);
      };
    default:
      return (v: number) => formatCount(v, locale);
  }
}

function getValueSizeClass(formatted: string): string {
  const length = formatted.length;

  if (length < 10) return "text-3xl sm:text-4xl";
  if (length < 13) return "text-2xl sm:text-3xl";
  if (length < 16) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}
export function StatsCard({
  title,
  value,
  description,
  variant = "currency",
  icon: IconComponent,
  tone: explicitTone,
  trend,
  href,
}: StatsCardProps) {
  const { profile } = useProfile();
  const { t } = useTranslation();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const numericValue = typeof value === "number" ? value : Number(value) || 0;

  const tone = resolveTone(explicitTone, variant, numericValue);

  const formatter = getFormatter(variant, locale, currency);
  const valueSizeClass = getValueSizeClass(formatter(numericValue));

  const trendGood = trend
    ? trend.invert
      ? trend.value <= 0
      : trend.value >= 0
    : true;
  const TrendIcon = trend && trend.value >= 0 ? ArrowUpRight : ArrowDownRight;

  const card = (
    <div className="group relative h-full">
      <Card
        className={cn(
          CARD_SHELL,
          "relative h-full gap-0 overflow-hidden py-0",
          "hover:-translate-y-1",
        )}
      >
        {/* Background gradient */}
        <div className={cn(CARD_BG_GRADIENT, toneBgClasses[tone])} />

        {/* Radial tone glow, revealed on hover */}
        <div
          className={cn(
            "pointer-events-none absolute -right-12 -top-16 size-44 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100",
            toneGlowClasses[tone],
          )}
        />

        {/* Top accent */}
        <div className={cn(CARD_TOP_ACCENT, toneBorderClasses[tone])} />

        <CardHeader className="relative flex flex-row items-center justify-between px-5 pb-3 pt-5">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
            {title}
          </CardTitle>

          {IconComponent && (
            <Animated.div
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.94 }}
              transition={{
                duration: 0.25,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-shadow duration-300 group-hover:shadow-md",
                toneAccentClasses[tone],
              )}
            >
              <Icon icon={IconComponent} className="size-[18px]" />
            </Animated.div>
          )}
        </CardHeader>

        <CardContent className="relative flex flex-1 flex-col px-5 pb-5 pt-2">
          {/* Main Value */}
          <Animated.p
            initial={{ scale: 0.96, opacity: 0, y: 4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
            className={cn(
              "font-bold leading-none tracking-tight tabular-nums",
              valueSizeClass,
              toneValueClasses[tone],
            )}
          >
            <AnimatedNumber value={numericValue} formatter={formatter} />
          </Animated.p>

          {/* Description/Label */}
          {description && (
            <Animated.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.16 }}
              className="mt-2 text-[13px] leading-snug text-muted-foreground"
            >
              {description}
            </Animated.p>
          )}

          {/* Footer Section */}
          <div className="mt-auto pt-4">
            <div className="mb-3 border-t border-border/40" />
            <div className="flex items-center justify-between">
              {/* Trend Indicator */}
              {trend ? (
                <div className="flex items-center gap-2.5">
                  <Animated.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    whileHover={{ y: -1 }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 ring-1 ring-inset transition duration-300 hover:ring-2",
                      trendGood
                        ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 hover:bg-emerald-500/15 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/25"
                        : "bg-rose-500/10 text-rose-700 ring-rose-500/15 hover:bg-rose-500/15 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/25",
                    )}
                  >
                    <Animated.div
                      whileHover={{
                        scale: 1.15,
                        rotate: trend.value >= 0 ? 10 : -10,
                      }}
                      whileTap={{ scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        stiffness: 240,
                        damping: 14,
                      }}
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full",
                        trendGood
                          ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-400",
                      )}
                    >
                      <Icon icon={TrendIcon} className="size-3" />
                    </Animated.div>
                    <span className="text-xs font-semibold tabular-nums leading-none">
                      {formatPercentage(Math.abs(trend.value), locale, 1)}
                    </span>
                  </Animated.div>
                  {trend.label && (
                    <Animated.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="text-[11px] leading-none text-muted-foreground"
                    >
                      {trend.label}
                    </Animated.span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {IconComponent && (
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-md",
                        toneAccentClasses[tone],
                      )}
                    >
                      <Icon icon={IconComponent} className="size-3.5" />
                    </div>
                  )}
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    {variant === "currency"
                      ? currency
                      : variant === "percentage"
                        ? "%"
                        : t("stats.items")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {card}
    </Link>
  );
}
