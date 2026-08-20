"use client";

import { useTranslation } from "react-i18next";
import { BarChart3, Target, Wallet } from "@/lib/icons";

const FEATURES = [
  {
    icon: BarChart3,
    titleKey: "onboarding.featureAnalyticsTitle" as const,
    descKey: "onboarding.featureAnalyticsDesc" as const,
    color: "from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: Wallet,
    titleKey: "onboarding.featureBudgetTitle" as const,
    descKey: "onboarding.featureBudgetDesc" as const,
    color:
      "from-violet-500/20 to-violet-600/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: Target,
    titleKey: "onboarding.featureGoalsTitle" as const,
    descKey: "onboarding.featureGoalsDesc" as const,
    color:
      "from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400",
  },
] as const;

export function FeaturesStep() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {t("nav.finances")}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("onboarding.welcomeDescription")}
      </p>

      <div className="mt-8 grid w-full max-w-sm gap-3 sm:gap-4">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.titleKey}
              className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 text-left shadow-sm"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t(feature.titleKey)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
