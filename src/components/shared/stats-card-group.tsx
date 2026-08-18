"use client";

import { Card, CardContent, CardHeader } from "@components/ui";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { buildDashboardCards } from "@utils/dashboard";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types/Dashboard";
import { useCardMotion } from "./card-motion";
import { CARD_BG_GRADIENT, CARD_SHELL, CARD_TOP_ACCENT } from "./card-tokens";
import { Skeleton } from "./skeleton";
import { StatsCard, type StatsCardProps } from "./stats-card";

interface StatsCardGroupProps {
  month: number;
  year: number;
}

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => `stats-sk-${i}`);

// Mobile: a full-bleed horizontal snap carousel (cards peek in from the
// right so it reads as swipeable). From `sm` up it becomes the multi-column
// grid. `pb-2` gives the card shadows room inside the scroll container.
const CONTAINER_CLASSES =
  "-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6";

const CARD_WRAPPER_CLASSES = "w-[85%] shrink-0 snap-start sm:w-auto";

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
  const { container, item } = useCardMotion();

  if (isLoading || !stats) {
    return (
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className={CONTAINER_CLASSES}
      >
        {SKELETON_KEYS.map((key) => (
          <motion.div
            key={key}
            variants={item}
            className={CARD_WRAPPER_CLASSES}
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
      variants={container}
      initial="hidden"
      animate="show"
      className={CONTAINER_CLASSES}
    >
      {cards.map((card) => (
        <motion.div
          key={card.title}
          variants={item}
          className={CARD_WRAPPER_CLASSES}
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
