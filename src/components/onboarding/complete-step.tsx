"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { ArrowRight, CheckCircle2 } from "@/lib/icons";

interface CompleteStepProps {
  onExplore: () => void;
}

export function CompleteStep({ onExplore }: CompleteStepProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleAddTransaction = () => {
    onExplore();
    router.push("/dashboard/transactions");
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("onboarding.completeTitle")}
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
        {t("onboarding.completeDescription")}
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Button
          onClick={handleAddTransaction}
          className="h-11 w-full text-base"
        >
          {t("onboarding.completeCta")}
          <ArrowRight className="ml-2 size-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={onExplore}
          className="h-11 w-full text-base text-muted-foreground"
        >
          {t("onboarding.completeExplore")}
        </Button>
      </div>
    </div>
  );
}
