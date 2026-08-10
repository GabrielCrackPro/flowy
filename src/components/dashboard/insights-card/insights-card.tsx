"use client";

import { EmptyState, Icon, SectionCard, Skeleton } from "@components/shared";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Lightbulb } from "@/lib/icons";
import {
  computeInsights,
  type Insight,
  type InsightSeverity,
} from "@/lib/services/insights";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types/Dashboard";

interface InsightsCardProps {
  month: number;
  year: number;
}

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function InsightIcon({ severity }: { severity: InsightSeverity }) {
  const map: Record<InsightSeverity, typeof Lightbulb> = {
    positive: CheckCircle2,
    neutral: Lightbulb,
    warning: AlertTriangle,
    critical: AlertTriangle,
  };
  const IconComponent = map[severity];
  return <Icon icon={IconComponent} className="size-4" />;
}

function InsightBg({ severity }: { severity: InsightSeverity }) {
  const map: Record<
    InsightSeverity,
    { bg: string; ring: string; text: string }
  > = {
    positive: {
      bg: "from-emerald-500/15 to-emerald-500/5",
      ring: "ring-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    neutral: {
      bg: "from-blue-500/15 to-blue-500/5",
      ring: "ring-blue-500/15",
      text: "text-blue-600 dark:text-blue-400",
    },
    warning: {
      bg: "from-amber-500/15 to-amber-500/5",
      ring: "ring-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
    },
    critical: {
      bg: "from-rose-500/15 to-rose-500/5",
      ring: "ring-rose-500/15",
      text: "text-rose-600 dark:text-rose-400",
    },
  };
  const s = map[severity];
  return `${s.bg} ${s.ring} ${s.text}`;
}

function InsightBorder({ severity }: { severity: InsightSeverity }) {
  const map: Record<InsightSeverity, string> = {
    positive: "from-emerald-500 via-emerald-400 to-emerald-500",
    neutral: "from-blue-500 via-blue-400 to-blue-500",
    warning: "from-amber-500 via-amber-400 to-amber-500",
    critical: "from-rose-500 via-rose-400 to-rose-500",
  };
  return map[severity];
}

function InsightRow({ insight }: { insight: Insight }) {
  const iconBg = InsightBg({ severity: insight.severity });

  return (
    <motion.div
      variants={item}
      className="group relative overflow-hidden rounded-xl border border-border/30 bg-card/50 transition-all duration-200 hover:border-border/60 hover:bg-card hover:shadow-sm"
    >
      {/* Left accent */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
          InsightBorder({ severity: insight.severity }),
        )}
      />

      <div className="flex items-start gap-3 p-3 pl-4">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
            iconBg,
          )}
        >
          <InsightIcon severity={insight.severity} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground/90">
            {insight.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground/80">
            {insight.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="mt-2 space-y-3 px-5 pb-6 sm:px-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-border/30 bg-card/50 p-3 pl-4"
        >
          <div className="size-8 shrink-0">
            <Skeleton variant="rounded" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4">
              <Skeleton />
            </div>
            <div className="h-3 w-full">
              <Skeleton />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InsightsCard({ month, year }: InsightsCardProps) {
  const { data, isLoading } = useDashboardData(month, year);
  const dashboardData = data as DashboardData | undefined;
  const { profile } = useProfile();
  const { t } = useTranslation();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  if (isLoading) {
    return (
      <SectionCard
        icon={<Icon icon={Lightbulb} className="size-5" />}
        title={t("insights.title")}
        description={t("insights.description")}
      >
        <InsightsSkeleton />
      </SectionCard>
    );
  }

  if (!dashboardData || !dashboardData.stats) {
    return (
      <SectionCard
        icon={<Icon icon={Lightbulb} className="size-5" />}
        title={t("insights.title")}
        description={t("insights.description")}
      >
        <div className="px-5 pb-6 sm:px-6">
          <EmptyState
            icon={<Icon icon={Lightbulb} size="lg" />}
            title={t("insights.emptyTitle")}
            description={t("insights.emptyDescription")}
            iconClassName="from-blue-500/20 to-blue-500/10 text-blue-600 ring-blue-500/10 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400"
          />
        </div>
      </SectionCard>
    );
  }

  const insights = computeInsights(dashboardData, {
    locale,
    currency,
    t,
  });

  if (insights.length === 0) {
    return (
      <SectionCard
        icon={<Icon icon={Lightbulb} className="size-5" />}
        title={t("insights.title")}
        description={t("insights.description")}
      >
        <div className="px-5 pb-6 sm:px-6">
          <EmptyState
            icon={<Icon icon={Lightbulb} size="lg" />}
            title={t("insights.emptyTitle")}
            description={t("insights.emptyDescription")}
            iconClassName="from-blue-500/20 to-blue-500/10 text-blue-600 ring-blue-500/10 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400"
          />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={<Icon icon={Lightbulb} className="size-5" />}
      title={t("insights.title")}
      description={t("insights.description")}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-2 space-y-3 px-5 pb-6 sm:px-6"
      >
        {insights.map((insight, index) => (
          <InsightRow key={`${insight.type}-${index}`} insight={insight} />
        ))}
      </motion.div>
    </SectionCard>
  );
}
