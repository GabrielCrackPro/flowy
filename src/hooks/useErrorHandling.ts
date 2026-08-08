/**
 * React hook for error handling with retry and graceful degradation
 */

import { useCallback, useState } from "react";
import {
  type AppError,
  classifyError,
  type DegradationStrategy,
  type RetryOptions,
  retryWithBackoff,
  withGracefulDegradation,
} from "@/lib/errors";

export interface UseErrorHandlingOptions {
  retryOptions?: RetryOptions;
  onError?: (error: AppError) => void;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDegraded, setIsDegraded] = useState(false);

  const handleError = useCallback(
    (err: unknown) => {
      const classifiedError = classifyError(err);
      setError(classifiedError);
      options.onError?.(classifiedError);
      return classifiedError;
    },
    [options],
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsDegraded(false);
  }, []);

  const executeWithRetry = useCallback(
    async <T>(fn: () => Promise<T>, retryOpts?: RetryOptions) => {
      setIsRetrying(true);
      clearError();

      const result = await retryWithBackoff(fn, {
        ...options.retryOptions,
        ...retryOpts,
      });

      setIsRetrying(false);

      if (!result.success) {
        handleError(result.error);
        throw result.error;
      }

      return result.data;
    },
    [options.retryOptions, handleError, clearError],
  );

  const executeWithDegradation = useCallback(
    async <T>(strategy: DegradationStrategy<T>, cacheKey?: string) => {
      clearError();

      try {
        const result = await withGracefulDegradation(strategy, cacheKey);
        setIsDegraded(result.isDegraded);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError, clearError],
  );

  const executeSafely = useCallback(
    async <T>(fn: () => Promise<T>) => {
      clearError();
      try {
        return await fn();
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError, clearError],
  );

  return {
    error,
    isRetrying,
    isDegraded,
    handleError,
    clearError,
    executeWithRetry,
    executeWithDegradation,
    executeSafely,
  };
}

/**
 * Hook for API calls with automatic error handling
 */
export function useApiCall<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      const classifiedError = classifyError(err);
      setError(classifiedError);
      throw classifiedError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}

/**
 * Hook for optimistic updates with rollback on error
 */
export function useOptimisticUpdate<T>() {
  const [pendingUpdate, setPendingUpdate] = useState<{
    data: T;
    rollback: () => void;
  } | null>(null);

  const executeOptimistic = useCallback(
    async <U>(
      optimisticData: T,
      mutation: () => Promise<U>,
      rollback: () => void,
    ) => {
      setPendingUpdate({ data: optimisticData, rollback });

      try {
        const result = await mutation();
        setPendingUpdate(null);
        return result;
      } catch (err) {
        rollback();
        setPendingUpdate(null);
        throw err;
      }
    },
    [],
  );

  const clearPending = useCallback(() => {
    if (pendingUpdate) {
      pendingUpdate.rollback();
      setPendingUpdate(null);
    }
  }, [pendingUpdate]);

  return {
    pendingUpdate: pendingUpdate?.data || null,
    executeOptimistic,
    clearPending,
    hasPendingUpdate: pendingUpdate !== null,
  };
}
