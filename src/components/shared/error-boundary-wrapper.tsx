"use client";

import { ErrorBoundary as ErrorBoundaryClass } from "./error-boundary";
import { useTranslation } from "react-i18next";
import { type ReactNode } from "react";

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Wrapper component that provides translation function to ErrorBoundary
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
}: ErrorBoundaryWrapperProps) {
  const { t } = useTranslation();

  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError} t={t}>
      {children}
    </ErrorBoundaryClass>
  );
}
