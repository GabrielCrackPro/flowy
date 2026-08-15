"use client";

import { Card, CardContent, CardHeader } from "@components/ui";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { buildDashboardCards } from "@utils/dashboard";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types/Dashboard";
import { CARD_BG_GRADIENT, CARD_SHELL, CARD_TOP_ACCENT } from "./card-tokens";
import { Skeleton } from "./skeleton";
import { StatsCard, type StatsCardProps } from "./stats-card";

interface StatsCardGroupProps {
  month: number;
  year: number;
}

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => `stats-sk-${i}`);

const GRID_CLASSES =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6";

function StatsCardSkeleton() {
  return (
    <Card
      className={cn(
        CARD_SHELL,
        "relative h-full gap-0 py-0 hover:translate-y-0",
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          CARD_BG_GRADIENT,
          "from-primary/8 via-primary/[0.03] to-transparent",
        )}
      />

      {/* Top gradient border */}
      <div
        className={cn(CARD_TOP_ACCENT, "from-primary via-primary to-primary")}
      />

      <CardHeader className="relative flex flex-row items-center justify-between px-5 pb-3 pt-5">
        <div className="h-3 w-24">
          <Skeleton />
        </div>
        <div className="size-9">
          <Skeleton variant="rounded" />
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col px-5 pb-5 pt-2">
        {/* Main Value */}
        <div className="h-9 w-32">
          <Skeleton />
        </div>

        {/* Description */}
        <div className="mt-2 h-4 w-40">
          <Skeleton />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="mb-3 border-t border-border/40" />
          <div className="flex items-center justify-between">
            {/* Left side - icon + label */}
            <div className="flex items-center gap-2">
              <div className="size-6">
                <Skeleton variant="rounded" />
              </div>
              <div className="h-3 w-12">
                <Skeleton />
              </div>
            </div>
            {/* Right side - progress bar or trend */}
            <div className="flex items-center gap-2.5">
              <div className="h-1.5 w-16">
                <Skeleton />
              </div>
              <div className="h-3 w-8">
                <Skeleton />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardGroup({ month, year }: StatsCardGroupProps) {
  const { data, isLoading } = useDashboardData(month, year);
  const stats = (data as DashboardData)?.stats;
  const { profile } = useProfile();
  const { t } = useTranslation();
  const locale = profile?.locale ?? "es-ES";

  if (isLoading || !stats) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={GRID_CLASSES}
      >
        {SKELETON_KEYS.map((key, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: index * 0.05,
              type: "spring",
              stiffness: 200,
            }}
          >
            <StatsCardSkeleton />
          </motion.div>
        ))}
      </motion.section>
    );
  }

  const cards: StatsCardProps[] = buildDashboardCards(
    stats,
    month,
    year,
    locale,
    t,
  );

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={GRID_CLASSES}
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.06,
            type: "spring",
            stiffness: 200,
          }}
        >
          <StatsCard
            title={card.title}
            value={card.value}
            description={card.description}
            variant={card.variant}
            icon={card.icon}
            tone={card.tone}
            trend={card.trend}
          />
        </motion.div>
      ))}
    </motion.section>
  );
}
