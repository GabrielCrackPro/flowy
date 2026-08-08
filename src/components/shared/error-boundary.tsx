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
import { AlertCircle, ArrowLeft, Home, RefreshCw } from "@/lib/icons";
import { Icon } from "./icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  t?: (key: string) => string; // Translation function
}

interface State {
  hasError: boolean;
  error?: Error;
  classifiedError?: AppError;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
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

  handleGoBack = () => {
    window.history.back();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  executeRecoveryAction = (action: RecoveryAction) => {
    try {
      action.action();
      this.handleReset();
    } catch (error) {
      console.error("Recovery action failed:", error);
    }
  };

  getSeverityColor = (error: AppError) => {
    switch (error.severity) {
      case "low":
        return "bg-warning/10 text-warning border-warning/30";
      case "medium":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "high":
        return "bg-destructive/20 text-destructive border-destructive/50";
      case "critical":
        return "bg-destructive/30 text-destructive border-destructive/70";
      default:
        return "bg-destructive/10 text-destructive border-destructive/30";
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error =
        this.state.classifiedError || classifyError(this.state.error);
      const t = this.props.t || ((key: string) => key); // Fallback to key if no translation function
      const userMessage = t(getUserFriendlyMessage(error));
      const severityColor = this.getSeverityColor(error);

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex size-20 items-center justify-center rounded-full border ${severityColor}`}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon icon={AlertCircle} className="size-10" />
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
                    Technical details
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
            {/* Primary recovery action */}
            {error.recoveryActions && error.recoveryActions.length > 0 && (
              <>
                {error.recoveryActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => this.executeRecoveryAction(action)}
                    variant={action.primary ? "default" : "outline"}
                    size="sm"
                  >
                    {t(action.label)}
                  </Button>
                ))}
              </>
            )}

            {/* Default fallback actions */}
            {(!error.recoveryActions || error.recoveryActions.length === 0) && (
              <>
                {error.isRetryable && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    size="sm"
                  >
                    <Icon icon={RefreshCw} className="size-4 mr-2" />
                    {t(ErrorTranslationKeys.RETRY)}
                  </Button>
                )}
                <Button onClick={this.handleGoBack} variant="outline" size="sm">
                  <Icon icon={ArrowLeft} className="size-4 mr-2" />
                  {t(ErrorTranslationKeys.GO_BACK)}
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" size="sm">
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
              Check your internet connection and try again
            </motion.p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
