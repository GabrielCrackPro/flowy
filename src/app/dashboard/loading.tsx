"use client";

import { Skeleton } from "@components/shared";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const loadingSteps = [
  { key: "auth", message: "dashboard.loading.auth", duration: 600 },
  { key: "data", message: "dashboard.loading.data", duration: 1000 },
  { key: "charts", message: "dashboard.loading.charts", duration: 800 },
  {
    key: "transactions",
    message: "dashboard.loading.transactions",
    duration: 600,
  },
  { key: "final", message: "dashboard.loading.final", duration: 400 },
];

export default function DashboardLoading() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const step = loadingSteps[currentStep];
    const totalDuration = loadingSteps.reduce((acc, s) => acc + s.duration, 0);
    const elapsedBefore = loadingSteps
      .slice(0, currentStep)
      .reduce((acc, s) => acc + s.duration, 0);

    // Progress animation
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        const target = ((elapsedBefore + step.duration) / totalDuration) * 100;
        if (prev < target) {
          return Math.min(prev + 3, target);
        }
        return prev;
      });
    }, 16);

    // Step transition
    timeout = setTimeout(() => {
      if (currentStep < loadingSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }, step.duration);

    return () => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
    };
  }, [currentStep]);

  return (
    <div className="space-y-10">
      {/* Loading Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-8 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="relative size-6"
            >
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent" />
            </motion.div>
            <motion.span
              key={currentStep}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-medium text-muted-foreground"
            >
              {t(loadingSteps[currentStep].message)}
            </motion.span>
          </div>
          <motion.span
            key={Math.round(progress)}
            initial={{ scale: 1.2, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sm font-bold text-primary tabular-nums"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
        {/* Step indicators */}
        <div className="flex gap-2">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={step.key}
              className="h-1 flex-1 rounded-full"
              initial={{ backgroundColor: "hsl(var(--muted))" }}
              animate={{
                backgroundColor:
                  index <= currentStep
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
                scale: index === currentStep ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <div className="size-10">
            <Skeleton variant="rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-40">
              <Skeleton />
            </div>
            <div className="h-4 w-24">
              <Skeleton />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/30 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24">
                <Skeleton />
              </div>
              <div className="size-8">
                <Skeleton variant="rounded" />
              </div>
            </div>
            <div className="h-8 w-32">
              <Skeleton />
            </div>
            <div className="h-4 w-20">
              <Skeleton />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts Section Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <div className="h-6 w-40">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-3 rounded-2xl border border-border/30 bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10">
                  <Skeleton variant="rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-32">
                    <Skeleton />
                  </div>
                  <div className="h-4 w-48">
                    <Skeleton />
                  </div>
                </div>
              </div>
              <div className="h-8 w-24">
                <Skeleton variant="rounded" />
              </div>
            </div>
            <div className="h-64 w-full">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/30 bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10">
                  <Skeleton variant="rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-32">
                    <Skeleton />
                  </div>
                  <div className="h-4 w-48">
                    <Skeleton />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-64 w-full">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Section Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      >
        <div className="xl:col-span-2 space-y-6">
          <div className="space-y-3 rounded-2xl border border-border/30 bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="size-10">
                <Skeleton variant="rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-32">
                  <Skeleton />
                </div>
                <div className="h-4 w-48">
                  <Skeleton />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-3 w-full">
                <Skeleton />
              </div>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-7">
                        <Skeleton variant="rounded" />
                      </div>
                      <div className="h-4 w-24">
                        <Skeleton />
                      </div>
                    </div>
                    <div className="h-4 w-20">
                      <Skeleton />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/30 bg-card p-6">
            <div className="space-y-2">
              <div className="h-5 w-32">
                <Skeleton />
              </div>
              <div className="h-4 w-48">
                <Skeleton />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <div className="size-8">
                    <Skeleton variant="rounded" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32">
                      <Skeleton />
                    </div>
                    <div className="h-3 w-24">
                      <Skeleton />
                    </div>
                  </div>
                  <div className="h-4 w-16">
                    <Skeleton />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3 rounded-2xl border border-border/30 bg-card p-6">
            <div className="space-y-2">
              <div className="h-5 w-32">
                <Skeleton />
              </div>
              <div className="h-4 w-48">
                <Skeleton />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-full">
                    <Skeleton />
                  </div>
                  <div className="h-3 w-3/4">
                    <Skeleton />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/30 bg-card p-6">
            <div className="space-y-2">
              <div className="h-5 w-32">
                <Skeleton />
              </div>
              <div className="h-4 w-48">
                <Skeleton />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-16">
                    <Skeleton />
                  </div>
                  <div className="h-4 w-24">
                    <Skeleton />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
