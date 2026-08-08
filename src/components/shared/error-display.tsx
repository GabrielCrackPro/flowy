"use client";

import { Button } from "@components/ui";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type AppError,
  classifyError,
  ErrorCategory,
  ErrorTranslationKeys,
  getRecoveryHintKey,
  getUserFriendlyMessage,
  RateLimitError,
} from "@/lib/errors/error-types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Home,
  RefreshCw,
  Shield,
  Wifi,
} from "@/lib/icons";
import { Icon } from "./icon";
import { RateLimitStatus } from "./rate-limit-status";

interface ErrorDisplayProps {
  error: Error | unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
  compact?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = "",
  compact = false,
}: ErrorDisplayProps) {
  const { t } = useTranslation();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(showDetails);
  const classifiedError = classifyError(error);
  const userMessage = t(getUserFriendlyMessage(classifiedError));
  const recoveryHint = t(getRecoveryHintKey(classifiedError));

  const getErrorIcon = () => {
    switch (classifiedError.category) {
      case ErrorCategory.NETWORK:
        return Wifi;
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.AUTHORIZATION:
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityColor = () => {
    switch (classifiedError.severity) {
      case "low":
        return "border-warning/50 bg-warning/10 text-warning";
      case "medium":
        return "border-destructive/50 bg-destructive/10 text-destructive";
      case "high":
        return "border-destructive/70 bg-destructive/20 text-destructive";
      case "critical":
        return "border-destructive bg-destructive/30 text-destructive";
      default:
        return "border-destructive/50 bg-destructive/10 text-destructive";
    }
  };

  const getRecoveryHint = () => {
    return recoveryHint;
  };

  const ErrorIcon = getErrorIcon();

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 rounded-lg border p-3 ${getSeverityColor()} ${className}`}
      >
        <Icon icon={ErrorIcon} className="size-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{userMessage}</p>
          <p className="text-xs opacity-80 truncate">{getRecoveryHint()}</p>
        </div>
        {onRetry && classifiedError.isRetryable && (
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
          >
            <Icon icon={RefreshCw} className="size-4" />
          </Button>
        )}
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
          >
            ×
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-border/30 bg-card p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Error icon */}
        <div
          className={`flex size-12 items-center justify-center rounded-full border ${getSeverityColor()} flex-shrink-0`}
        >
          <Icon icon={ErrorIcon} className="size-6" />
        </div>

        {/* Error content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1">
            {t(ErrorTranslationKeys.SOMETHING_WENT_WRONG)}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">{userMessage}</p>

          {/* Recovery hint */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground mb-3">
            {getRecoveryHint()}
          </div>

          {/* Rate limit countdown */}
          {classifiedError instanceof RateLimitError && (
            <div className="mb-3">
              <RateLimitStatus
                retryAfter={classifiedError.retryAfter}
                retryAt={classifiedError.retryAt}
                onRetry={onRetry}
                compact={true}
              />
            </div>
          )}

          {/* Technical details (expandable) */}
          {process.env.NODE_ENV === "development" && (
            <details className="mb-3">
              <summary
                className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              >
                <Icon icon={AlertCircle} className="size-3" />
                Technical details
              </summary>
              {showTechnicalDetails && (
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-border/30 bg-muted/30 p-3 text-xs text-muted-foreground">
                  {error instanceof Error ? error.message : String(error)}
                  {error instanceof Error && error.stack && (
                    <>
                      {"\n\n"}
                      <span className="opacity-70">{error.stack}</span>
                    </>
                  )}
                </pre>
              )}
            </details>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {onRetry &&
              classifiedError.isRetryable &&
              (classifiedError instanceof RateLimitError ? (
                <RateLimitStatus
                  retryAfter={classifiedError.retryAfter}
                  retryAt={classifiedError.retryAt}
                  onRetry={onRetry}
                  compact={true}
                />
              ) : (
                <Button onClick={onRetry} size="sm" variant="default">
                  <Icon icon={RefreshCw} className="size-4 mr-2" />
                  {t(ErrorTranslationKeys.RETRY)}
                </Button>
              ))}

            {classifiedError.recoveryActions?.map((action, index) => (
              <Button
                key={index}
                onClick={() => {
                  try {
                    action.action();
                  } catch (err) {
                    console.error("Recovery action failed:", err);
                  }
                }}
                size="sm"
                variant={action.primary ? "default" : "outline"}
              >
                {t(action.label)}
              </Button>
            ))}

            <Button
              onClick={() => window.history.back()}
              size="sm"
              variant="outline"
            >
              <Icon icon={ArrowLeft} className="size-4 mr-2" />
              {t(ErrorTranslationKeys.GO_BACK)}
            </Button>

            <Button
              onClick={() => (window.location.href = "/dashboard")}
              size="sm"
              variant="outline"
            >
              <Icon icon={Home} className="size-4 mr-2" />
              {t(ErrorTranslationKeys.GO_HOME)}
            </Button>
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
          >
            ×
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Inline error display for smaller spaces
 */
export function InlineError({
  error,
  onRetry,
  className = "",
}: {
  error: Error | unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const classifiedError = classifyError(error);
  const userMessage = t(getUserFriendlyMessage(classifiedError));

  return (
    <div
      className={`flex items-center gap-2 text-sm text-destructive ${className}`}
    >
      <Icon icon={AlertCircle} className="size-4 flex-shrink-0" />
      <span className="flex-1">{userMessage}</span>
      {onRetry &&
        classifiedError.isRetryable &&
        (classifiedError instanceof RateLimitError ? (
          <RateLimitStatus
            retryAfter={classifiedError.retryAfter}
            retryAt={classifiedError.retryAt}
            onRetry={onRetry}
            compact={true}
          />
        ) : (
          <button
            onClick={onRetry}
            className="text-xs font-medium hover:underline flex-shrink-0"
          >
            {t(ErrorTranslationKeys.RETRY)}
          </button>
        ))}
    </div>
  );
}

/**
 * Loading error state with retry capability
 */
export function LoadingError({
  error,
  onRetry,
  className = "",
}: {
  error: Error | unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const classifiedError = classifyError(error);
  const userMessage = t(getUserFriendlyMessage(classifiedError));

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <Icon icon={AlertTriangle} className="size-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          {t(ErrorTranslationKeys.FAILED_TO_LOAD)}
        </h3>
        <p className="text-sm text-muted-foreground">{userMessage}</p>
      </div>
      {onRetry &&
        classifiedError.isRetryable &&
        (classifiedError instanceof RateLimitError ? (
          <RateLimitStatus
            retryAfter={classifiedError.retryAfter}
            retryAt={classifiedError.retryAt}
            onRetry={onRetry}
          />
        ) : (
          <Button onClick={onRetry} variant="outline" size="sm">
            <Icon icon={RefreshCw} className="size-4 mr-2" />
            {t(ErrorTranslationKeys.RETRY)}
          </Button>
        ))}
    </div>
  );
}
