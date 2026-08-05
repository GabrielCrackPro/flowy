"use client";

import { DashboardCustomize } from "@components/dashboard";
import { Alert, Icon, RelativeTime, Skeleton } from "@components/shared";
import { Button } from "@components/ui";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocaleContext } from "@/context/LocaleContext";
import {
  CalendarDays,
  Moon,
  RefreshCcw,
  RotateCcw,
  Sun,
  Sunset,
} from "@/lib/icons";
import { getGreetingMessage } from "@/utils/dashboard";

interface DashboardHeaderProps {
  month: number;
  year: number;
}

function getGreetingIcon(_locale?: string) {
  const hour = new Date().getHours();
  if (hour < 12) return Sun;
  if (hour < 20) return Sunset;
  return Moon;
}

function getGreetingGradient() {
  const hour = new Date().getHours();
  if (hour < 12)
    return "from-amber-500/20 to-amber-500/10 text-amber-600 dark:from-amber-500/30 dark:to-amber-500/20 dark:text-amber-400";
  if (hour < 20)
    return "from-orange-500/20 to-orange-500/10 text-orange-600 dark:from-orange-500/30 dark:to-orange-500/20 dark:text-orange-400";
  return "from-indigo-500/20 to-indigo-500/10 text-indigo-600 dark:from-indigo-500/30 dark:to-indigo-500/20 dark:text-indigo-400";
}

export function DashboardHeader({ month, year }: DashboardHeaderProps) {
  const { profile } = useProfile();
  const { error, isLoading, isFetching, dataUpdatedAt, refetch } =
    useDashboardData(month, year);
  const handleRefresh = () => refetch();
  const { t } = useTranslation();
  const { locale } = useLocaleContext();
  const profileLoading = !profile;
  const GreetingIcon = getGreetingIcon(locale);
  const greetingGradient = getGreetingGradient();

  const todayLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [locale]);

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Skeleton loading={isLoading && profileLoading}>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "hidden size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-black/5 sm:flex dark:ring-white/10",
                  greetingGradient,
                )}
              >
                <GreetingIcon className="size-5" />
              </motion.div>
              <span className="truncate">
                {getGreetingMessage(locale)}
                {profile && (
                  <span className="text-muted-foreground/80">
                    , {profile.name ?? profile.email ?? t("profile.user")}
                  </span>
                )}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-1.5 text-sm text-muted-foreground/70"
            >
              {todayLabel}
            </motion.p>
          </Skeleton>
        </div>

        <Skeleton loading={isLoading}>
          <div className="flex min-w-0 items-center gap-2">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-full border py-1.5 pl-2 pr-1.5 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-colors",
                isFetching
                  ? "border-primary/30 bg-primary/[0.04]"
                  : "border-border/30 bg-card/70",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon icon={CalendarDays} className="h-3.5 w-3.5" />
              </span>
              {isFetching ? (
                <span
                  className="min-w-0 truncate text-xs font-medium text-primary/90 sm:text-sm"
                  aria-live="polite"
                >
                  {t("dashboard.updating")}
                </span>
              ) : (
                <RelativeTime
                  date={dataUpdatedAt}
                  prefix={t("dashboard.updated")}
                  className="min-w-0 truncate text-xs sm:text-sm"
                />
              )}
              <span aria-hidden className="h-4 w-px bg-border/70" />
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                disabled={isFetching}
                aria-label={t("dashboard.refresh")}
                aria-busy={isFetching}
                className="flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-full px-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:px-2"
              >
                <Icon
                  icon={RefreshCcw}
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                />
              </motion.button>
            </motion.div>
            <DashboardCustomize compact />
          </div>
        </Skeleton>
      </div>

      <Alert
        variant="danger"
        title={t("dashboard.statsNotLoaded")}
        description={error instanceof Error ? error.message : String(error)}
        visible={!!error}
        action={
          <Button
            variant="ghost"
            className="border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 hover:text-rose-600 dark:text-rose-400"
            onClick={handleRefresh}
          >
            <Icon icon={RotateCcw} className="w-4 h-4" />
            <span>{t("dashboard.retry")}</span>
          </Button>
        }
      />

      <div className="h-px bg-gradient-to-r from-primary/30 via-border/50 to-transparent" />
    </motion.section>
  );
}
