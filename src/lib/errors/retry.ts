/**
 * Retry mechanism for API failures with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  data: T;
  attempts: number;
  success: true;
}

export interface RetryError {
  error: Error;
  attempts: number;
  success: false;
}

export type RetryResponse<T> = RetryResult<T> | RetryError;

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    "network",
    "fetch",
    "connection",
    "timeout",
    "503",
    "502",
    "504",
    "ECONNRESET",
    "ETIMEDOUT",
  ],
  onRetry: () => {},
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Check if an error is retryable based on the error message
 */
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  const errorMessage = error.message.toLowerCase();
  return retryableErrors.some((pattern) =>
    errorMessage.includes(pattern.toLowerCase()),
  );
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResponse<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        data,
        attempts: attempt,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(lastError, config.retryableErrors)) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier,
      );

      config.onRetry(attempt, lastError);
      await sleep(delay);
    }
  }

  return {
    error: lastError || new Error("Unknown error"),
    attempts: config.maxAttempts,
    success: false,
  };
}

/**
 * Retry with a custom condition function
 */
export async function retryWithCondition<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  options: RetryOptions = {},
): Promise<RetryResponse<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        data,
        attempts: attempt,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Check custom retry condition
      if (!shouldRetry(lastError)) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier,
      );

      config.onRetry(attempt, lastError);
      await sleep(delay);
    }
  }

  return {
    error: lastError || new Error("Unknown error"),
    attempts: config.maxAttempts,
    success: false,
  };
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(private options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      ...options,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (this.shouldAttemptReset()) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is OPEN - service unavailable");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold!) {
      this.state = "open";
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime > this.options.recoveryTimeout!;
  }

  getState(): "closed" | "open" | "half-open" {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = "closed";
  }
}

/**
 * Debounced retry for user-triggered actions
 */
export function createDebouncedRetry<T>(
  fn: () => Promise<T>,
  delay: number = 1000,
): () => Promise<RetryResponse<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastAttempt = 0;

  return async (): Promise<RetryResponse<T>> => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttempt;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve) => {
      timeoutId = setTimeout(
        async () => {
          lastAttempt = Date.now();
          const result = await retryWithBackoff(fn, {
            maxAttempts: 2,
            initialDelay: 500,
          });
          resolve(result);
        },
        Math.max(0, delay - timeSinceLastAttempt),
      );
    });
  };
}
