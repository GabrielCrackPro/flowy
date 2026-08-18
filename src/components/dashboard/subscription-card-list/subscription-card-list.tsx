"use client";

import {
  Alert,
  EmptyState,
  Icon,
  SectionCard,
  Skeleton,
  useCardMotion,
} from "@components/shared";
import { useSubscriptionApi } from "@hooks/api/useSubscriptionApi";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { ArrowRight, Repeat2 } from "@/lib/icons";

export function SubscriptionCardListSkeleton() {
  const { container, item } = useCardMotion();
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-2"
    >
      {[1, 2, 3, 4].map((row, index) => (
        <motion.div key={row} variants={item}>
          <div className="flex items-center justify-between gap-3 border-t border-border/30 px-5 py-3.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton variant="circular" className="size-9 shrink-0" />
              <div className="min-w-0 space-y-1.5">
                <Skeleton
                  className={cn("h-3.5", index % 2 === 0 ? "w-28" : "w-24")}
                />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton variant="rounded" className="h-5 w-14 shrink-0" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function SubscriptionCardList() {
  const { subscriptions, loading, error } = useSubscriptionApi();
  const { t } = useTranslation();
  const { container, item } = useCardMotion();

  return (
    <SectionCard
      icon={<Icon icon={Repeat2} className="size-5" />}
      title={t("nav.subscriptions")}
      action={
        <Link
          href="/dashboard/subscriptions"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("dashboard.viewAll")}
          <Icon icon={ArrowRight} className="size-3.5" />
        </Link>
      }
    >
      {error ? (
        <div className="px-6 pb-6">
          <Alert
            visible={true}
            variant="danger"
            title={t("subscriptions.errorTitle")}
            description={error instanceof Error ? error.message : String(error)}
          />
        </div>
      ) : loading ? (
        <SubscriptionCardListSkeleton />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Repeat2} size="lg" />}
          title={t("subscriptions.emptyTitle")}
          description={t("subscriptions.emptyDescription")}
          iconClassName="from-sky-500/20 to-sky-500/10 text-sky-600 ring-sky-500/10 dark:from-sky-500/30 dark:to-sky-500/20 dark:text-sky-400"
          action={
            <Link
              href="/dashboard/subscriptions"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("subscriptions.emptyAction")}
              <Icon icon={ArrowRight} className="size-3.5" />
            </Link>
          }
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="pb-2"
        >
          {subscriptions.map((subscription) => (
            <motion.div key={subscription.id} variants={item}>
              <SubscriptionCard subscription={subscription} compact />
            </motion.div>
          ))}
        </motion.div>
      )}
    </SectionCard>
  );
}
