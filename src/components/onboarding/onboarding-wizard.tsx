"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { useOnboarding } from "@/context/OnboardingContext";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { CompleteStep } from "./complete-step";
import { FeaturesStep } from "./features-step";
import { NotificationsStep } from "./notifications-step";
import { WelcomeStep } from "./welcome-step";

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export function OnboardingWizard() {
  const { t } = useTranslation();
  const { needsOnboarding, completeOnboarding, dismissOnboarding } =
    useOnboarding();
  const { profile } = useProfile();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    dismissOnboarding();
  }, [dismissOnboarding]);

  const handleComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Keyboard navigation
  useEffect(() => {
    if (!needsOnboarding) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (step < TOTAL_STEPS - 1) {
          e.preventDefault();
          goNext();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [needsOnboarding, step, goNext, goPrev, handleSkip]);

  if (!needsOnboarding) return null;

  const isLastStep = step === TOTAL_STEPS - 1;
  const userName = profile?.name ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Desktop: centered dialog. Mobile: full-screen card. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative z-10 flex flex-col bg-card shadow-2xl",
          // Mobile: full-screen card
          "inset-2 sm:inset-auto",
          "sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-full sm:max-w-md sm:rounded-2xl",
          "rounded-2xl border border-border/30",
        )}
        role="dialog"
        aria-label={t("onboarding.stepOf", {
          current: step + 1,
          total: TOTAL_STEPS,
        })}
      >
        {/* Skip button */}
        {!isLastStep && (
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-4 top-4 z-20 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("onboarding.skip")}
          </button>
        )}

        {/* Step content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8 sm:py-10">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {step === 0 && <WelcomeStep userName={userName} />}
              {step === 1 && <FeaturesStep />}
              {step === 2 && <NotificationsStep onContinue={goNext} />}
              {step === 3 && <CompleteStep onExplore={handleComplete} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: progress dots + navigation */}
        <div className="flex items-center justify-between border-t border-border/50 px-6 py-4 sm:px-8">
          {/* Progress dots */}
          <div className="flex gap-2" aria-hidden="true">
            {"welcome features notifications complete"
              .split(" ")
              .map((key, i) => (
                <div
                  key={key}
                  className={cn(
                    "size-2 rounded-full transition-all duration-300",
                    i === step
                      ? "w-6 bg-primary"
                      : i < step
                        ? "bg-primary/40"
                        : "bg-muted-foreground/20",
                  )}
                />
              ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                className="text-muted-foreground"
              >
                {t("common.back")}
              </Button>
            )}
            {!isLastStep && step !== 2 && (
              <Button size="sm" onClick={goNext}>
                {t("common.next", "Next")}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
