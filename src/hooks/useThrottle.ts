import { useCallback, useEffect, useRef } from "react";

interface ThrottleOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Custom hook for throttling function calls
 * @param callback - The function to throttle
 * @param options - Throttle configuration
 * @returns Throttized function
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  { delay, leading = true, trailing = true }: ThrottleOptions,
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If leading edge and enough time has passed, execute immediately
      if (leading && timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
        return;
      }

      // Store arguments for trailing edge
      argsRef.current = args;

      // Schedule trailing edge execution
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          const remainingDelay = delay - (Date.now() - lastCallRef.current);
          if (remainingDelay <= 0) {
            lastCallRef.current = Date.now();
            if (argsRef.current) {
              callback(...argsRef.current);
            }
          } else {
            timeoutRef.current = setTimeout(() => {
              lastCallRef.current = Date.now();
              if (argsRef.current) {
                callback(...argsRef.current);
              }
            }, remainingDelay);
          }
          timeoutRef.current = null;
        }, timeSinceLastCall);
      }
    },
    [callback, delay, leading, trailing],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Simple throttle function for non-hook usage
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      callback(...args);
      return;
    }

    lastArgs = args;

    timeout = setTimeout(() => {
      const remainingDelay = delay - (Date.now() - lastCall);
      if (remainingDelay <= 0) {
        lastCall = Date.now();
        if (lastArgs) {
          callback(...lastArgs);
        }
      } else {
        timeout = setTimeout(() => {
          lastCall = Date.now();
          if (lastArgs) {
            callback(...lastArgs);
          }
        }, remainingDelay);
      }
      timeout = null;
    }, timeSinceLastCall);
  };
}
