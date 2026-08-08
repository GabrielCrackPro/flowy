"use client";

import { useTranslation } from "react-i18next";

import { Icon } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell } from "@/lib/icons";

export function PushNotificationsCard() {
  const { t } = useTranslation();
  const {
    supported,
    configured,
    permission,
    subscribed,
    busy,
    enable,
    disable,
  } = usePushNotifications();

  if (!supported || !configured) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.notifications.title")}</CardTitle>
        <CardDescription>
          {t("settings.notifications.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
              <Icon icon={Bell} className="size-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">
                {t("settings.notifications.pushLabel")}
              </p>
              <p className="text-sm text-muted-foreground">
                {permission === "denied"
                  ? t("settings.notifications.denied")
                  : subscribed
                    ? t("settings.notifications.enabled")
                    : t("settings.notifications.disabled")}
              </p>
            </div>
          </div>
          <Switch
            checked={subscribed}
            disabled={busy || permission === "denied"}
            onCheckedChange={(next) => {
              void (next ? enable() : disable());
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
