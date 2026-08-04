"use client";

import {
  Alert,
  CardSkeleton,
  EmptyState,
  Icon,
  SectionCard,
} from "@components/shared";
import { useSubscriptionApi } from "@hooks/api/useSubscriptionApi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { ArrowRight, Repeat2 } from "@/lib/icons";

export function SubscriptionCardList() {
  const { subscriptions, loading, error } = useSubscriptionApi();
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t("nav.subscriptions")}
      action={
        <Link
          href="/dashboard/subscriptions"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("dashboard.viewAll")}
          <Icon icon={ArrowRight} className="h-3.5 w-3.5" />
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
        <CardSkeleton variant="row" count={4} />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Repeat2} className="size-5" />}
          title={t("subscriptions.emptyTitle")}
          description={t("subscriptions.emptyDescription")}
        />
      ) : (
        <div className="pb-2">
          {subscriptions.map((subscription, index) => (
            <motion.div
              key={subscription.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <SubscriptionCard subscription={subscription} compact />
            </motion.div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
