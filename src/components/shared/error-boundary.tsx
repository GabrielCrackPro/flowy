"use client";

import { Button } from "@components/ui";
import { motion } from "framer-motion";
import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  type AppError,
  classifyError,
  ErrorTranslationKeys,
  getUserFriendlyMessage,
  type RecoveryAction,
} from "@/lib/errors/error-types";
import { AlertTriangle, ArrowLeft, Home, RefreshCw, Wifi } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

interface ErrorBoundaryInnerProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  t: (key: string) => string;
}

interface State {
  hasError: boolean;
  error?: Error;
  classifiedError?: AppError;
}

class ErrorBoundaryInner extends Component<ErrorBoundaryInnerProps, State> {
  constructor(props: ErrorBoundaryInnerProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const classifiedError = classifyError(error);
    return { hasError: true, error, classifiedError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      classifiedError: undefined,
    });
  };

  handleRetry = () => {
    this.handleReset();
    window.location.reload();
  };

  executeRecoveryAction = (action: RecoveryAction) => {
    try {
      action.action();
      this.handleReset();
    } catch (error) {
      console.error("Recovery action failed:", error);
    }
  };

  getErrorIcon = (error: AppError) => {
    switch (error.category) {
      case "network":
        return Wifi;
      default:
        return AlertTriangle;
    }
  };

  getSeverityClasses = (error: AppError) => {
    switch (error.severity) {
      case "low":
        return "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400";
      case "medium":
        return "border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 text-destructive";
      case "high":
      case "critical":
        return "border-destructive/50 bg-gradient-to-br from-destructive/20 to-destructive/10 text-destructive";
      default:
        return "border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 text-destructive";
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error =
        this.state.classifiedError || classifyError(this.state.error);
      const { t } = this.props;
      const userMessage = t(getUserFriendlyMessage(error));
      const ErrorIcon = this.getErrorIcon(error);
      const severityClasses = this.getSeverityClasses(error);
      const canRetry = error.isRetryable;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "relative flex size-20 items-center justify-center rounded-2xl border shadow-lg",
              severityClasses,
            )}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon icon={ErrorIcon} className="size-10" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center space-y-3 max-w-md"
          >
            <h3 className="text-xl font-semibold">
              {t(ErrorTranslationKeys.SOMETHING_WENT_WRONG)}
            </h3>
            <p className="text-sm text-muted-foreground">{userMessage}</p>
            {process.env.NODE_ENV === "development" &&
              this.state.error?.message && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {t("errors.technicalDetails")}
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-border/30 bg-muted/50 p-3 text-xs text-muted-foreground">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 flex-wrap justify-center"
          >
            {error.recoveryActions && error.recoveryActions.length > 0
              ? error.recoveryActions.map((action) => (
                  <Button
                    key={action.label}
                    onClick={() => this.executeRecoveryAction(action)}
                    variant={action.primary ? "default" : "outline"}
                    size="sm"
                  >
                    {t(action.label)}
                  </Button>
                ))
              : null}

            {(!error.recoveryActions || error.recoveryActions.length === 0) && (
              <>
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    size="sm"
                  >
                    <Icon icon={RefreshCw} className="size-4 mr-2" />
                    {t(ErrorTranslationKeys.RETRY)}
                  </Button>
                )}
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  size="sm"
                >
                  <Icon icon={ArrowLeft} className="size-4 mr-2" />
                  {t(ErrorTranslationKeys.GO_BACK)}
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Icon icon={Home} className="size-4 mr-2" />
                  {t(ErrorTranslationKeys.GO_HOME)}
                </Button>
              </>
            )}
          </motion.div>

          {error.category === "network" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="text-xs text-muted-foreground text-center"
            >
              {t(ErrorTranslationKeys.NETWORK_HINT)}
            </motion.p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** @deprecated No longer needed — translation is handled internally. */
  t?: (key: string) => string;
}

/**
 * Error boundary that catches render errors and displays a styled fallback.
 * Translation is handled automatically via `useTranslation()`.
 */
export function ErrorBoundary({
  children,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  const { t } = useTranslation();

  return (
    <ErrorBoundaryInner t={t} fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryInner>
  );
}
