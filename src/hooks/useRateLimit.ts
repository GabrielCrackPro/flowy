/**
 * React hook for tracking rate limit status
 */

import { useCallback, useEffect, useState } from "react";
import type { RateLimitError } from "@/lib/errors/error-types";

interface RateLimitStatus {
  isRateLimited: boolean;
  remainingTime: number;
  canRetry: boolean;
  retryAt?: Date;
  error?: RateLimitError;
}

export function useRateLimit() {
  const [status, setStatus] = useState<RateLimitStatus>({
    isRateLimited: false,
    remainingTime: 0,
    canRetry: true,
  });

  const setRateLimit = useCallback((error: RateLimitError) => {
    setStatus({
      isRateLimited: true,
      remainingTime: error.getRemainingTime(),
      canRetry: error.canRetry(),
      retryAt: error.retryAt,
      error,
    });
  }, []);

  const clearRateLimit = useCallback(() => {
    setStatus({
      isRateLimited: false,
      remainingTime: 0,
      canRetry: true,
    });
  }, []);

  // Update remaining time every second when rate limited
  useEffect(() => {
    if (!status.isRateLimited || !status.retryAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        (status.retryAt?.getTime() ?? 0) - Date.now(),
      );
      const remainingSeconds = Math.ceil(remaining / 1000);

      setStatus((prev) => ({
        ...prev,
        remainingTime: remainingSeconds,
        canRetry: remaining <= 0,
      }));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status.isRateLimited, status.retryAt]);

  return {
    ...status,
    setRateLimit,
    clearRateLimit,
  };
}

/**
 * Hook for checking if a specific action is rate limited
 */
export function useRateLimitAction(actionName: string) {
  const [rateLimits, setRateLimits] = useState<Record<string, RateLimitStatus>>(
    {},
  );

  const setActionRateLimit = useCallback(
    (error: RateLimitError) => {
      setRateLimits((prev) => ({
        ...prev,
        [actionName]: {
          isRateLimited: true,
          remainingTime: error.getRemainingTime(),
          canRetry: error.canRetry(),
          retryAt: error.retryAt,
          error,
        },
      }));
    },
    [actionName],
  );

  const clearActionRateLimit = useCallback(() => {
    setRateLimits((prev) => ({
      ...prev,
      [actionName]: {
        isRateLimited: false,
        remainingTime: 0,
        canRetry: true,
      },
    }));
  }, [actionName]);

  const getActionStatus = useCallback(() => {
    return (
      rateLimits[actionName] || {
        isRateLimited: false,
        remainingTime: 0,
        canRetry: true,
      }
    );
  }, [rateLimits, actionName]);

  // Update remaining time for rate limited actions
  useEffect(() => {
    const actionStatus = rateLimits[actionName];
    if (!actionStatus?.isRateLimited || !actionStatus.retryAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        (actionStatus.retryAt?.getTime() ?? 0) - Date.now(),
      );
      const remainingSeconds = Math.ceil(remaining / 1000);

      setRateLimits((prev) => ({
        ...prev,
        [actionName]: {
          ...prev[actionName],
          remainingTime: remainingSeconds,
          canRetry: remaining <= 0,
        },
      }));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimits, actionName]);

  return {
    status: getActionStatus(),
    setRateLimit: setActionRateLimit,
    clearRateLimit: clearActionRateLimit,
  };
}

/**
 * Hook for showing rate limit notifications
 */
export function useRateLimitNotification() {
  const [notification, setNotification] = useState<{
    show: boolean;
    remainingTime: number;
    actionName?: string;
  }>({
    show: false,
    remainingTime: 0,
  });

  const showNotification = useCallback(
    (remainingTime: number, actionName?: string) => {
      setNotification({
        show: true,
        remainingTime,
        actionName,
      });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 5000);
    },
    [],
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
}
