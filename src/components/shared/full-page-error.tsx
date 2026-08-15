"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  classifyError,
  ErrorCategory,
  ErrorTranslationKeys,
  getRecoveryHintKey,
  getUserFriendlyMessage,
  RateLimitError,
} from "@/lib/errors/error-types";
import {
  AlertTriangle,
  ArrowLeft,
  Droplet,
  Home,
  RefreshCw,
  Shield,
  Wifi,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { DecorativeBackdrop } from "./decorative-backdrop";
import { Icon } from "./icon";
import { RateLimitStatus } from "./rate-limit-status";

interface FullPageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Override the container min-height (e.g. inside the auth layout). */
  className?: string;
  /** Show the decorative background (gradient + dot pattern). */
  decorative?: boolean;
}

/**
 * Full-page error state used by every route-level error boundary (root,
 * dashboard and auth). Classifies the error, translates the message, shows a
 * rate-limit countdown when relevant and offers retry / back / home actions.
 * Respects prefers-reduced-motion and logs the error in development.
 */
export function FullPageError({
  error,
  reset,
  className,
  decorative = true,
}: FullPageErrorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Log route-level errors so they surface in devtools.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Route error boundary caught:", error);
    }
  }, [error]);

  const classifiedError = classifyError(error);
  const userMessage = t(getUserFriendlyMessage(classifiedError));
  const recoveryHint = t(getRecoveryHintKey(classifiedError));

  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (classifiedError instanceof RateLimitError) {
      setRemainingTime(classifiedError.getRemainingTime());
      const interval = setInterval(() => {
        const time = classifiedError.getRemainingTime();
        setRemainingTime(time);
        if (time <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [classifiedError]);

  const getErrorIcon = () => {
    switch (classifiedError.category) {
      case ErrorCategory.NETWORK:
        return Wifi;
      case ErrorCategory.DATABASE:
        return AlertTriangle;
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.AUTHORIZATION:
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const ErrorIcon = getErrorIcon();

  const handleContactSupport = () => {
    window.location.href = "mailto:support@flowy.app";
  };

  const canRetry =
    classifiedError.isRetryable &&
    (classifiedError instanceof RateLimitError
      ? classifiedError.canRetry()
      : true);

  return (
    <div
      className={cn(
        "relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-16",
        className,
      )}
    >
      {decorative ? <DecorativeBackdrop tint="destructive" /> : null}

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex w-full max-w-lg flex-col items-center gap-8 text-center"
      >
        {/* Error icon */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-destructive/20 blur-xl"
          />
          <div className="relative flex size-20 items-center justify-center rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 text-destructive shadow-lg shadow-destructive/20">
            <motion.div
              animate={
                prefersReducedMotion ? undefined : { rotate: [0, 10, -10, 0] }
              }
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon icon={ErrorIcon} className="size-10" />
            </motion.div>
          </div>
        </motion.div>

        {/* Brand badge */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 rounded-full border border-border/30 bg-gradient-to-r from-card/80 to-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm shadow-md"
        >
          <motion.div
            animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-md"
          >
            <Icon icon={Droplet} className="size-3.5" />
          </motion.div>
          Flowy
          <span className="text-muted-foreground/30">·</span>
          <span className="font-semibold text-destructive">
            {t(ErrorTranslationKeys.GENERIC_TITLE)}
          </span>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            {t(ErrorTranslationKeys.GENERIC_TITLE)}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground/80">
            {userMessage}
          </p>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-lg border border-border/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          >
            {recoveryHint}
          </motion.div>

          {classifiedError instanceof RateLimitError && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <RateLimitStatus
                retryAfter={remainingTime}
                retryAt={classifiedError.retryAt}
                onRetry={remainingTime <= 0 ? reset : undefined}
              />
            </motion.div>
          )}

          {process.env.NODE_ENV === "development" && (
            <motion.details
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-left"
            >
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <Icon icon={AlertTriangle} className="size-4" />
                {t("errors.technicalDetails")}
              </summary>
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-border/30 bg-gradient-to-br from-muted/50 to-muted/30 p-4 text-xs text-muted-foreground shadow-sm">
                {error.message}
                {error.digest ? `\nDigest: ${error.digest}` : ""}
                {"\n"}
                Category: {classifiedError.category}
                {"\n"}
                Severity: {classifiedError.severity}
                {"\n"}
                Retryable: {classifiedError.isRetryable ? "Yes" : "No"}
                {classifiedError instanceof RateLimitError
                  ? `\nRetry After: ${classifiedError.getRemainingTime()}s`
                  : ""}
              </pre>
            </motion.details>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
        >
          {canRetry && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:from-primary/90 hover:to-primary/80 hover:shadow-lg sm:w-auto"
            >
              <Icon icon={RefreshCw} className="size-4" />
              {t(ErrorTranslationKeys.RETRY)}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 px-5 text-sm font-medium text-foreground shadow-md transition hover:from-muted/60 hover:to-muted/40 hover:shadow-lg sm:w-auto"
          >
            <Icon icon={ArrowLeft} className="size-4" />
            {t(ErrorTranslationKeys.GO_BACK)}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 px-5 text-sm font-medium text-foreground shadow-md transition hover:from-muted/60 hover:to-muted/40 hover:shadow-lg sm:w-auto"
          >
            <Icon icon={Home} className="size-4" />
            {t(ErrorTranslationKeys.GO_HOME)}
          </button>
        </motion.div>

        {/* Contact support */}
        <motion.button
          type="button"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onClick={handleContactSupport}
          className="text-xs text-muted-foreground/60 underline transition-colors hover:text-muted-foreground"
        >
          {t(ErrorTranslationKeys.CONTACT_SUPPORT)}
        </motion.button>
      </motion.div>
    </div>
  );
}
