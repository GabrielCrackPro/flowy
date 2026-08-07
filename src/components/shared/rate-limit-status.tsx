"use client";

import { Icon } from "@/components/shared";
import { AlertTriangle, Clock } from "@/lib/icons";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorTranslationKeys } from "@/lib/errors/error-types";

interface RateLimitStatusProps {
  retryAfter?: number;
  retryAt?: Date;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export function RateLimitStatus({
  retryAfter,
  retryAt,
  onRetry,
  compact = false,
  className = "",
}: RateLimitStatusProps) {
  const { t } = useTranslation();
  const [remainingTime, setRemainingTime] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  // Calculate initial remaining time
  useEffect(() => {
    const calculateRemaining = () => {
      if (retryAt) {
        const remaining = Math.max(0, retryAt.getTime() - Date.now());
        setRemainingTime(Math.ceil(remaining / 1000));
        setCanRetry(remaining <= 0);
      } else if (retryAfter) {
        setRemainingTime(retryAfter);
        setCanRetry(false);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [retryAfter, retryAt]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 text-sm text-warning ${className}`}
      >
        <Icon icon={Clock} className="size-4" />
        {canRetry ? (
          <span>{t("errors.rateLimit.retryNow")}</span>
        ) : (
          <span>
            {t("errors.rateLimit.waitTime")}: {formatTime(remainingTime)}
          </span>
        )}
        {onRetry && canRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium hover:underline"
          >
            {t(ErrorTranslationKeys.RETRY)}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border border-warning/30 bg-warning/10 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-warning/20 flex-shrink-0">
          <Icon icon={AlertTriangle} className="size-4 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-warning mb-1">
            {t("errors.rateLimit.title")}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            {t("errors.rateLimit.description")}
          </p>
          <div className="flex items-center gap-2">
            <Icon icon={Clock} className="size-3 text-muted-foreground" />
            {canRetry ? (
              <span className="text-xs font-medium text-foreground">
                {t("errors.rateLimit.retryNow")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("errors.rateLimit.waitTime")}:{" "}
                <span className="font-medium text-foreground">
                  {formatTime(remainingTime)}
                </span>
              </span>
            )}
          </div>
        </div>
        {onRetry && canRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 text-xs font-medium text-warning hover:text-warning/80 transition-colors"
          >
            {t(ErrorTranslationKeys.RETRY)}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Rate limit badge for inline display
 */
export function RateLimitBadge({
  remainingTime,
  canRetry = false,
}: {
  remainingTime: number;
  canRetry?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning/10 border border-warning/30 text-xs text-warning">
      <Icon icon={Clock} className="size-3" />
      {canRetry ? (
        <span>{t("errors.rateLimit.retryNow")}</span>
      ) : (
        <span>{formatTime(remainingTime)}</span>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
