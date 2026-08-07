"use client";

import { Button } from "@components/ui";
import {
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  Icon,
  RelativeTime,
  SectionCard,
} from "@components/shared";
import { useDashboardData } from "@hooks/useDashboardData";
import { useProfile } from "@hooks/useProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shared/toast";
import { clearActivities } from "@/lib/api/activity";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CornerDownRight,
  MessageSquare,
  Tag,
  Target,
  Trash2,
  Users,
  Wallet,
  Repeat2,
} from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { Activity } from "@/types/Activity";

function getActivityMetadata(
  activity: Activity,
  locale: string,
  currency: string,
) {
  const metadata = activity.metadata ?? {};

  return {
    name: String(metadata.name ?? ""),
    title: String(metadata.title ?? ""),
    merchant: String(metadata.merchant ?? ""),
    description: String(metadata.description ?? ""),
    amount:
      metadata.amount == null
        ? ""
        : formatCurrency(Number(metadata.amount), locale, currency),
    transactionType: String(metadata.type ?? ""),
  };
}

function getActivityMessage(
  activity: Activity,
  locale: string,
  currency: string,
  t: (key: string, vars?: Record<string, unknown>) => string,
) {
  const [entity, action] = activity.type.split(".");
  const meta = getActivityMetadata(activity, locale, currency);
  const metadata = activity.metadata ?? {};

  const fallback =
    meta.description ||
    meta.title ||
    meta.name ||
    meta.merchant ||
    meta.amount ||
    (metadata.spaceName ? `Espacio: ${metadata.spaceName}` : "") ||
    (metadata.actorName ? `por ${metadata.actorName}` : "");

  const key = `activity.${entity}${action.charAt(0).toUpperCase()}${action.slice(1)}`;

  const vars = {
    description: fallback,
    amount: meta.amount,
    title: meta.title || fallback,
    merchant: meta.merchant || fallback,
    name: meta.name || fallback,
    spaceName: String(metadata.spaceName ?? ""),
    actorName: String(metadata.actorName ?? ""),
  };

  const translation = t(key);

  if (translation === key) {
    return fallback;
  }

  return t(key, vars);
}

const ACTIVITY_STYLES = {
  budget: {
    Icon: Wallet,
    className:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  },
  goal: {
    Icon: Target,
    className:
      "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  },
  subscription: {
    Icon: Repeat2,
    className: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  },
  category: {
    Icon: Tag,
    className:
      "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  },
  space: {
    Icon: Users,
    className: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  },
} as const;

function getActivityAppearance(activity: Activity) {
  const [entity] = activity.type.split(".");
  const metadata = activity.metadata ?? {};

  if (entity === "transaction") {
    const income = metadata.type === "INCOME";

    return {
      Icon: income ? ArrowUpCircle : ArrowDownCircle,
      className: income
        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    };
  }

  if (activity.type === "comment.replied") {
    return {
      Icon: CornerDownRight,
      className:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    };
  }

  if (activity.type === "space.memberRemoved") {
    return {
      Icon: Users,
      className:
        "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    };
  }

  if (entity in ACTIVITY_STYLES) {
    return ACTIVITY_STYLES[entity as keyof typeof ACTIVITY_STYLES];
  }

  return {
    Icon: MessageSquare,
    className: "bg-muted text-muted-foreground",
  };
}

export function ActivityFeedCard({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const activeSpaceId = profile?.activeSpaceId ?? null;
  const { data, isLoading: loading } = useDashboardData(month, year);
  const activities = (data as { activities?: Activity[] })?.activities ?? [];
  const [confirmOpen, setConfirmOpen] = useState(false);

  const clearMutation = useMutation({
    mutationFn: clearActivities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", activeSpaceId] });
      toast.success("Actividad eliminada correctamente");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete activity",
      );
    },
  });

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const isEmpty = !loading && activities.length === 0;

  const handleClear = async () => {
    setConfirmOpen(false);
    await clearMutation.mutateAsync();
  };

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("activity.clearConfirmTitle")}
        description={t("activity.clearConfirmDescription")}
        confirmLabel={t("activity.clear")}
        onConfirm={handleClear}
      />

      <SectionCard
        title={t("activity.title")}
        description={t("activity.desc")}
        action={
          activities.length > 0 && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setConfirmOpen(true)}
              disabled={
                loading || clearMutation.isPending || activities.length === 0
              }
            >
              <Icon
                icon={Trash2}
                className={cn(
                  "size-4",
                  clearMutation.isPending && "animate-pulse",
                )}
              />
            </Button>
          )
        }
      >
        {loading && activities.length === 0 ? (
          <div>
            <CardSkeleton variant="row" count={5} />
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={<Icon icon={MessageSquare} className="size-5" />}
            title={t("activity.empty")}
          />
        ) : (
          <div className="relative px-5 pb-5 pt-2 sm:px-6">
            {activities.map((activity, index) => {
              const { Icon, className } = getActivityAppearance(activity);
              const isLast = index === activities.length - 1;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative flex gap-3.5 pb-5 last:pb-1"
                >
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-4 top-9 h-[calc(100%-0.75rem)] w-px bg-gradient-to-b from-border/80 via-border/40 to-transparent"
                    />
                  )}

                  <div className="relative mt-0.5 flex shrink-0">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background transition-transform duration-200 group-hover:scale-110",
                        className,
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-sm leading-snug text-foreground/90">
                      {getActivityMessage(activity, locale, currency, t)}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground/60">
                      <RelativeTime date={activity.createdAt} locale={locale} />
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </>
  );
}
