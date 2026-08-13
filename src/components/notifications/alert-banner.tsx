"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Banner } from "@/components/shared/banner";
import type { InboxAlert } from "@/lib/api/notifications";
import { notificationsApi } from "@/lib/api/notifications";
import { getAlertAction } from "@/utils/alerts";

interface AlertBannerProps {
  alert: InboxAlert;
  onDismiss: () => void;
}

export function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const action = getAlertAction(alert.type);

  function handleOpen() {
    toast.dismiss(alert.id);
    if (action) router.push(action.url);
  }

  function handleAction() {
    toast.dismiss(alert.id);
    void notificationsApi.markRead({ ids: [alert.id] }).catch(() => {});
    if (action) router.push(action.url);
  }

  return (
    <Banner
      severity={alert.severity}
      title={alert.title}
      description={alert.description ?? undefined}
      onBodyClick={handleOpen}
      actionLabel={action ? t(action.labelKey) : undefined}
      onAction={action ? handleAction : undefined}
      onDismiss={onDismiss}
      dismissLabel={t("alerts.dismiss")}
    />
  );
}
