"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { BudgetIcon, GoalIcon, Icon } from "@/components/shared";
import { Button, Dialog, DialogContent } from "@/components/ui";
import { useOnboarding } from "@/context/OnboardingContext";
import { useProfile } from "@/hooks/useProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Droplet,
  Loader2,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { FEATURE_TILE_STYLES, OnboardingStep } from "./onboarding-step";

// ── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;
const STEPS = ["welcome", "features", "notifications", "complete"] as const;

const FEATURES = [
  {
    icon: BarChart3,
    titleKey: "onboarding.featureAnalyticsTitle" as const,
    descKey: "onboarding.featureAnalyticsDesc" as const,
    tone: "info" as const,
  },
  {
    icon: BudgetIcon,
    titleKey: "onboarding.featureBudgetTitle" as const,
    descKey: "onboarding.featureBudgetDesc" as const,
    tone: "warning" as const,
  },
  {
    icon: GoalIcon,
    titleKey: "onboarding.featureGoalsTitle" as const,
    descKey: "onboarding.featureGoalsDesc" as const,
    tone: "success" as const,
  },
] as const;

// ── State ───────────────────────────────────────────────────────────────────

type Action = { type: "NEXT" } | { type: "PREV" } | { type: "RESET" };

function stepReducer(state: number, action: Action): number {
  switch (action.type) {
    case "NEXT":
      return Math.min(state + 1, TOTAL_STEPS - 1);
    case "PREV":
      return Math.max(state - 1, 0);
    case "RESET":
      return 0;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { needsOnboarding, completeOnboarding, dismissOnboarding } =
    useOnboarding();
  const { profile } = useProfile();
  const [step, dispatch] = useReducer(stepReducer, 0);
  const [direction, setDirection] = useState(1);

  const wrappedDispatch = useCallback((action: Action) => {
    setDirection(action.type === "NEXT" ? 1 : -1);
    dispatch(action);
  }, []);

  const userName = profile?.name?.split(" ")[0] ?? "";
  const isLastStep = step === TOTAL_STEPS - 1;

  const handleClose = useCallback(() => {
    dismissOnboarding();
  }, [dismissOnboarding]);

  const handleComplete = useCallback(() => {
    void completeOnboarding();
    router.push("/dashboard");
  }, [completeOnboarding, router]);

  // Reset step when onboarding is replayed
  useEffect(() => {
    if (needsOnboarding) dispatch({ type: "RESET" });
  }, [needsOnboarding]);

  // Keyboard navigation
  useEffect(() => {
    if (!needsOnboarding) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowRight" && step < TOTAL_STEPS - 1) {
        e.preventDefault();
        wrappedDispatch({ type: "NEXT" });
      } else if (e.key === "ArrowLeft" && step > 0) {
        e.preventDefault();
        wrappedDispatch({ type: "PREV" });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [needsOnboarding, step, handleClose, wrappedDispatch]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleClose();
    },
    [handleClose],
  );

  // Unmount when onboarding is done — safety net for React 19 Base UI store sync.
  if (!needsOnboarding) return null;

  return (
    <Dialog open={needsOnboarding} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-4 p-6 sm:p-8">
        {/* Step dots */}
        <div
          className="flex items-center justify-center gap-2.5"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={t("onboarding.stepOf", {
            current: step + 1,
            total: TOTAL_STEPS,
          })}
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={s}
              animate={{
                width: i === step ? 32 : 8,
                scale: i === step ? 1.15 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "h-2 rounded-full",
                i === step
                  ? "bg-primary"
                  : i < step
                    ? "bg-primary/40"
                    : "bg-muted-foreground/20",
              )}
            />
          ))}
        </div>
        {/* Step content — smooth crossfade with popLayout */}
        <div className="flex flex-col items-center justify-center py-2">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, y: direction * 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction * -16 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              className="flex w-full flex-col items-center"
            >
              {step === 0 && (
                <WelcomeStep
                  userName={userName}
                  onNext={() => wrappedDispatch({ type: "NEXT" })}
                />
              )}
              {step === 1 && <FeaturesStep />}
              {step === 2 && (
                <NotificationsStep
                  onContinue={() => wrappedDispatch({ type: "NEXT" })}
                />
              )}
              {step === 3 && <CompleteStep router={router} />}
            </motion.div>
          </AnimatePresence>
        </div>{" "}
        {/* Footer — step 0 only shows Skip (CTA is in the step content) */}
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          {step === 0 ? (
            <Button
              variant="ghost"
              onClick={handleClose}
              className="h-10 w-full rounded-xl text-sm text-muted-foreground hover:text-foreground"
            >
              {t("onboarding.skip")}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => wrappedDispatch({ type: "PREV" })}
                className="h-10 gap-1.5 rounded-xl px-4 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                {t("common.back")}
              </Button>

              <Button
                onClick={
                  isLastStep
                    ? handleComplete
                    : () => wrappedDispatch({ type: "NEXT" })
                }
                className="h-10 gap-2 rounded-xl px-5 text-sm font-semibold"
              >
                {isLastStep
                  ? t("onboarding.completeExplore")
                  : t("common.next")}
                {!isLastStep && <ArrowRight className="size-4" />}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Welcome step ────────────────────────────────────────────────────────────

function WelcomeStep({
  userName,
  onNext,
}: {
  userName: string;
  onNext: () => void;
}) {
  const { t } = useTranslation();

  return (
    <OnboardingStep
      tone="welcome"
      icon={Droplet}
      title={t("onboarding.welcomeTitle", { name: userName })}
      description={t("onboarding.welcomeDescription")}
    >
      <div className="mt-5">
        <Button
          onClick={onNext}
          className="h-10 rounded-xl px-6 text-sm font-semibold gap-2"
        >
          {t("common.getStarted")}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </OnboardingStep>
  );
}

// ── Features step ───────────────────────────────────────────────────────────

function FeaturesStep() {
  const { t } = useTranslation();

  return (
    <OnboardingStep
      tone="features"
      icon={BarChart3}
      title={t("onboarding.featuresTitle")}
      description={t("onboarding.featuresDescription")}
    >
      <div className="mt-5 grid w-full gap-2">
        {FEATURES.map((f) => (
          <div
            key={f.titleKey}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-left"
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                FEATURE_TILE_STYLES[f.tone],
              )}
            >
              <Icon icon={f.icon} size="lg" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-foreground">
                {t(f.titleKey)}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {t(f.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </OnboardingStep>
  );
}

// ── Notifications step ──────────────────────────────────────────────────────

function NotificationsStep({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  const { supported, checked, subscribed, busy, enable } = usePushNotifications(
    {
      checkRemoteSubscription: false,
    },
  );

  const handleEnable = async () => {
    await enable();
    onContinue();
  };

  return (
    <OnboardingStep
      tone="notifications"
      icon={Bell}
      title={t("onboarding.notificationTitle")}
      description={t("onboarding.notificationDescription")}
    >
      <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5">
        {!checked ? (
          /* Loading skeleton while checking push notification status */
          <div className="space-y-2.5">
            <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-muted/60" />
          </div>
        ) : checked && subscribed ? (
          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t("onboarding.notificationAlreadyEnabled")}
            </p>
          </div>
        ) : checked && !supported ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-5 py-3.5">
            <p className="text-sm text-muted-foreground">
              {t("onboarding.notificationNotSupported")}
            </p>
          </div>
        ) : (
          <>
            <Button
              onClick={() => void handleEnable()}
              disabled={busy}
              className="h-11 w-full rounded-xl text-sm"
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
              className="h-10 w-full rounded-xl text-sm text-muted-foreground hover:text-foreground"
            >
              {t("onboarding.notificationLater")}
            </Button>
          </>
        )}
      </div>
    </OnboardingStep>
  );
}

// ── Complete step ───────────────────────────────────────────────────────────

function CompleteStep({ router }: { router: ReturnType<typeof useRouter> }) {
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboarding();

  const handleExplore = useCallback(() => {
    void completeOnboarding();
    router.push("/dashboard");
  }, [completeOnboarding, router]);

  return (
    <OnboardingStep
      tone="complete"
      icon={CheckCircle2}
      title={t("onboarding.completeTitle")}
      description={t("onboarding.completeDescription")}
      hint={t("onboarding.completeReplayHint")}
    >
      <div className="mt-5 flex w-full max-w-sm flex-col gap-2.5">
        <Button
          onClick={handleExplore}
          className="h-11 w-full rounded-xl gap-2 text-sm font-semibold"
        >
          {t("onboarding.completeCta")}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </OnboardingStep>
  );
}
