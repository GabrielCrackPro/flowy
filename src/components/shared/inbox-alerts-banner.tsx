"use client";

import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Banner } from "@/components/shared/banner";
import {
  BannerStripMotion,
  useBannerStackItem,
} from "@/components/shared/banner-stack";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import type { InboxAlert } from "@/lib/api/notifications";
import { getAlertAction } from "@/utils/alerts";

function InboxAlertStrip({
  alert,
  onDismiss,
}: {
  alert: InboxAlert;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const action = getAlertAction(alert.type);

  function handleAction() {
    onDismiss();
    if (action) router.push(action.url);
  }

  const { ownDismissHidden, staggerDelay } = useBannerStackItem({
    visible: true,
    onDismiss,
  });

  return (
    <BannerStripMotion delay={staggerDelay}>
      <Banner
        variant="strip"
        severity={alert.severity}
        title={alert.title}
        description={alert.description ?? undefined}
        actionLabel={action ? t(action.labelKey) : undefined}
        actionIcon={action?.icon}
        onAction={action ? handleAction : undefined}
        onDismiss={ownDismissHidden ? undefined : onDismiss}
        dismissLabel={t("alerts.dismiss")}
      />
    </BannerStripMotion>
  );
}

/**
 * Persistent under-header strips for inbox alerts (the realtime/push alerts
 * previously toasted for 6 seconds). Each unread, unresolved alert gets its
 * own strip and stays visible until dismissed (marked read) or acted on, so
 * nothing disappears before the user has seen it. Renders nothing while the
 * inbox is empty.
 */
export function InboxAlertsBanner() {
  const { user } = useAuth();
  const { alerts, dismiss } = useNotifications(user?.id);

  const activeAlerts = alerts.filter(
    (alert) => !alert.readAt && !alert.resolvedAt,
  );

  return (
    <AnimatePresence initial={false}>
      {activeAlerts.map((alert) => (
        <InboxAlertStrip
          key={alert.id}
          alert={alert}
          onDismiss={() => void dismiss(alert.id)}
        />
      ))}
    </AnimatePresence>
  );
}
