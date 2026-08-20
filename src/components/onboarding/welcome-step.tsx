"use client";

import { useTranslation } from "react-i18next";
import { Droplet, Sparkles } from "@/lib/icons";

interface WelcomeStepProps {
  userName: string | null;
}

export function WelcomeStep({ userName }: WelcomeStepProps) {
  const { t } = useTranslation();
  const displayName = userName?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/25">
        <Droplet className="size-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("onboarding.welcomeTitle", { name: displayName })}
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
        {t("onboarding.welcomeDescription")}
      </p>
      <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <Sparkles className="size-3.5" />
        <span>Finance, simplified</span>
      </div>
    </div>
  );
}
