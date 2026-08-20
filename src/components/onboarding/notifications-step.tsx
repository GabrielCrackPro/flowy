"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, Loader2 } from "@/lib/icons";

interface NotificationsStepProps {
  onContinue: () => void;
}

export function NotificationsStep({ onContinue }: NotificationsStepProps) {
  const { t } = useTranslation();
  const { supported, checked, busy, enable } = usePushNotifications({
    checkRemoteSubscription: false,
  });

  const handleEnable = async () => {
    await enable();
    onContinue();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400">
        <Bell className="size-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("onboarding.notificationTitle")}
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
        {t("onboarding.notificationDescription")}
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {checked && !supported ? (
          <p className="text-sm text-muted-foreground">
            {t("onboarding.notificationNotSupported")}
          </p>
        ) : (
          <>
            <Button
              onClick={() => void handleEnable()}
              disabled={busy}
              className="h-11 w-full text-base"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("onboarding.notificationEnable")}
                </>
              ) : (
                t("onboarding.notificationEnable")
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onContinue}
              className="h-11 w-full text-base text-muted-foreground"
            >
              {t("onboarding.notificationLater")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
