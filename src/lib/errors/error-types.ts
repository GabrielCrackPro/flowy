/**
 * Enhanced error classification system for better error handling
 */

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NOT_FOUND = "not_found",
  SERVER = "server",
  DATABASE = "database",
  RATE_LIMIT = "rate_limit",
  SERVICE_UNAVAILABLE = "service_unavailable",
  UNKNOWN = "unknown",
}

/**
 * Translation keys for error messages
 */
export const ErrorTranslationKeys = {
  NETWORK: "errors.network.message",
  VALIDATION: "errors.validation.message",
  AUTHENTICATION: "errors.authentication.message",
  AUTHORIZATION: "errors.authorization.message",
  NOT_FOUND: "errors.notFound.message",
  SERVER: "errors.server.message",
  DATABASE: "errors.database.message",
  RATE_LIMIT: "errors.rateLimit.message",
  SERVICE_UNAVAILABLE: "errors.serviceUnavailable.message",
  UNKNOWN: "errors.unknown.message",

  // Recovery hints
  NETWORK_HINT: "errors.network.hint",
  VALIDATION_HINT: "errors.validation.hint",
  AUTHENTICATION_HINT: "errors.authentication.hint",
  AUTHORIZATION_HINT: "errors.authorization.hint",
  RATE_LIMIT_HINT: "errors.rateLimit.hint",
  SERVICE_UNAVAILABLE_HINT: "errors.serviceUnavailable.hint",
  DEFAULT_HINT: "errors.default.hint",

  // Action labels
  RETRY: "errors.actions.retry",
  GO_BACK: "errors.actions.goBack",
  GO_HOME: "errors.actions.goHome",
  CONTACT_SUPPORT: "errors.actions.contactSupport",
  FIX_ERRORS: "errors.actions.fixErrors",
  SIGN_IN: "errors.actions.signIn",

  // Titles
  GENERIC_TITLE: "errors.title",
  FAILED_TO_LOAD: "errors.failedToLoad",
  SOMETHING_WENT_WRONG: "errors.somethingWentWrong",
  RATE_LIMIT_TITLE: "errors.rateLimit.title",
  RATE_LIMIT_RETRYING_IN: "errors.rateLimit.retryingIn",
} as const;

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface ErrorContext {
  timestamp: Date;
  userId?: string;
  route?: string;
  endpoint?: string;
  additionalData?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code?: string;
  constructor(
    message: string,
    public category: ErrorCategory,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public statusCode: number = 500,
    public context?: ErrorContext,
    public recoveryActions?: RecoveryAction[],
    public isRetryable: boolean = false,
    code?: string,
  ) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toResponse() {
    return {
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      recoveryActions: this.recoveryActions?.map((action) => ({
        label: action.label,
        primary: action.primary,
      })),
    };
  }
}

export class DomainError extends AppError {
  constructor(
    code: string,
    message: string,
    statusCode: number,
    category: ErrorCategory = statusCode === 404
      ? ErrorCategory.NOT_FOUND
      : statusCode === 403
        ? ErrorCategory.AUTHORIZATION
        : ErrorCategory.VALIDATION,
  ) {
    super(
      message,
      category,
      ErrorSeverity.MEDIUM,
      statusCode,
      undefined,
      undefined,
      false,
      code,
    );
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.NETWORK,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      503,
      context,
      [
        {
          label: ErrorTranslationKeys.RETRY,
          action: () => window.location.reload(),
          primary: true,
        },
        {
          label: ErrorTranslationKeys.NETWORK_HINT,
          action: () => {
            // Could open network diagnostics or show connection status
            console.log("Check network connection");
          },
        },
      ],
      true, // Network errors are retryable
    );
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.VALIDATION,
    public fields?: Record<string, string>,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      400,
      context,
      [
        {
          label: ErrorTranslationKeys.FIX_ERRORS,
          action: () => {
            // Focus on first error field
            const firstField = Object.keys(fields || {})[0];
            if (firstField) {
              const element = document.querySelector(`[name="${firstField}"]`);
              element?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          },
          primary: true,
        },
      ],
      false, // Validation errors are not retryable without fixes
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.AUTHENTICATION,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      401,
      context,
      [
        {
          label: ErrorTranslationKeys.SIGN_IN,
          action: () => {
            window.location.href = "/auth/login";
          },
          primary: true,
        },
      ],
      false, // Auth errors require user action
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.AUTHORIZATION,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      403,
      context,
      [
        {
          label: ErrorTranslationKeys.GO_BACK,
          action: () => window.history.back(),
          primary: true,
        },
        {
          label: ErrorTranslationKeys.CONTACT_SUPPORT,
          action: () => {
            window.location.href = "mailto:support@flowy.app";
          },
        },
      ],
      false, // Authorization errors are not retryable
    );
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.NOT_FOUND,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.LOW,
      404,
      context,
      [
        {
          label: ErrorTranslationKeys.GO_BACK,
          action: () => window.history.back(),
          primary: true,
        },
        {
          label: ErrorTranslationKeys.GO_HOME,
          action: () => {
            window.location.href = "/dashboard";
          },
        },
      ],
      false, // Not found errors are not retryable
    );
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.SERVICE_UNAVAILABLE,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.SERVICE_UNAVAILABLE,
      ErrorSeverity.HIGH,
      503,
      context,
      [
        {
          label: ErrorTranslationKeys.RETRY,
          action: () => window.location.reload(),
          primary: true,
        },
        {
          label: ErrorTranslationKeys.GO_HOME,
          action: () => {
            window.location.href = "/dashboard";
          },
        },
      ],
      true, // Service unavailable errors are retryable
    );
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.RATE_LIMIT,
    public retryAfter?: number,
    public retryAt?: Date,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      429,
      context,
      [
        {
          label: ErrorTranslationKeys.RETRY,
          action: () => {
            // Show countdown or wait indicator
            console.log("Rate limited, please wait");
          },
          primary: true,
        },
      ],
      true, // Rate limit errors are retryable after delay
    );
  }

  /**
   * Get the remaining time until retry is allowed
   */
  getRemainingTime(): number {
    if (!this.retryAt) return this.retryAfter || 0;
    const remaining = Math.max(0, this.retryAt.getTime() - Date.now());
    return Math.ceil(remaining / 1000); // Return in seconds
  }

  /**
   * Check if retry is now allowed
   */
  canRetry(): boolean {
    return this.getRemainingTime() <= 0;
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string = ErrorTranslationKeys.DATABASE,
    context?: ErrorContext,
  ) {
    super(
      message,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      500,
      context,
      [
        {
          label: ErrorTranslationKeys.RETRY,
          action: () => window.location.reload(),
          primary: true,
        },
        {
          label: ErrorTranslationKeys.CONTACT_SUPPORT,
          action: () => {
            window.location.href = "mailto:support@flowy.app";
          },
        },
      ],
      false, // Database errors are generally not retryable from client
    );
  }
}

/**
 * Classify an unknown error into an AppError
 */
export function classifyError(
  error: unknown,
  context?: ErrorContext,
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle API response errors that might be objects
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;

    // Check if it's a rate limit error from API
    if (
      errorObj.category === "rate_limit" ||
      errorObj.message === "Too many requests" ||
      (errorObj as { status?: number }).status === 429
    ) {
      const retryAfter = errorObj.retryAfter as number | undefined;
      const retryAt = errorObj.retryAt
        ? new Date(errorObj.retryAt as string)
        : retryAfter
          ? new Date(Date.now() + retryAfter * 1000)
          : undefined;

      return new RateLimitError(
        ErrorTranslationKeys.RATE_LIMIT,
        retryAfter,
        retryAt,
        context,
      );
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      return new NetworkError(error.message, context);
    }

    // Not found errors
    if (message.includes("not found") || message.includes("404")) {
      return new NotFoundError(error.message, context);
    }

    // Authorization errors
    if (
      message.includes("unauthorized") ||
      message.includes("authentication") ||
      message.includes("401")
    ) {
      return new AuthenticationError(error.message, context);
    }

    // Permission errors
    if (
      message.includes("forbidden") ||
      message.includes("permission") ||
      message.includes("403")
    ) {
      return new AuthorizationError(error.message, context);
    }

    // Validation errors
    if (
      message.includes("validation") ||
      message.includes("invalid") ||
      message.includes("400")
    ) {
      return new ValidationError(error.message, undefined, context);
    }

    // Rate limit errors
    if (
      message.includes("rate limit") ||
      message.includes("too many") ||
      message.includes("429")
    ) {
      return new RateLimitError(error.message, undefined, undefined, context);
    }

    // Service unavailable
    if (
      message.includes("unavailable") ||
      message.includes("503") ||
      message.includes("timeout")
    ) {
      return new ServiceUnavailableError(error.message, context);
    }

    // Default to generic server error
    return new AppError(
      error.message,
      ErrorCategory.SERVER,
      ErrorSeverity.HIGH,
      500,
      context,
      [
        {
          label: ErrorTranslationKeys.RETRY,
          action: () => window.location.reload(),
          primary: true,
        },
        {
          label: ErrorTranslationKeys.CONTACT_SUPPORT,
          action: () => {
            window.location.href = "mailto:support@flowy.app";
          },
        },
      ],
      false,
    );
  }

  // Unknown error type
  return new AppError(
    ErrorTranslationKeys.UNKNOWN,
    ErrorCategory.UNKNOWN,
    ErrorSeverity.HIGH,
    500,
    context,
    [
      {
        label: ErrorTranslationKeys.RETRY,
        action: () => window.location.reload(),
        primary: true,
      },
    ],
    false,
  );
}

/**
 * Get user-friendly error message based on error category
 * Returns translation key for i18n
 */
export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: ErrorTranslationKeys.NETWORK,
    [ErrorCategory.VALIDATION]: ErrorTranslationKeys.VALIDATION,
    [ErrorCategory.AUTHENTICATION]: ErrorTranslationKeys.AUTHENTICATION,
    [ErrorCategory.AUTHORIZATION]: ErrorTranslationKeys.AUTHORIZATION,
    [ErrorCategory.NOT_FOUND]: ErrorTranslationKeys.NOT_FOUND,
    [ErrorCategory.SERVER]: ErrorTranslationKeys.SERVER,
    [ErrorCategory.DATABASE]: ErrorTranslationKeys.DATABASE,
    [ErrorCategory.RATE_LIMIT]: ErrorTranslationKeys.RATE_LIMIT,
    [ErrorCategory.SERVICE_UNAVAILABLE]:
      ErrorTranslationKeys.SERVICE_UNAVAILABLE,
    [ErrorCategory.UNKNOWN]: ErrorTranslationKeys.UNKNOWN,
  };

  return messages[error.category] || error.message;
}

/**
 * Get recovery hint translation key based on error category
 */
export function getRecoveryHintKey(error: AppError): string {
  const hints: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: ErrorTranslationKeys.NETWORK_HINT,
    [ErrorCategory.VALIDATION]: ErrorTranslationKeys.VALIDATION_HINT,
    [ErrorCategory.AUTHENTICATION]: ErrorTranslationKeys.AUTHENTICATION_HINT,
    [ErrorCategory.AUTHORIZATION]: ErrorTranslationKeys.AUTHORIZATION_HINT,
    [ErrorCategory.RATE_LIMIT]: ErrorTranslationKeys.RATE_LIMIT_HINT,
    [ErrorCategory.SERVICE_UNAVAILABLE]:
      ErrorTranslationKeys.SERVICE_UNAVAILABLE_HINT,
    [ErrorCategory.NOT_FOUND]: ErrorTranslationKeys.DEFAULT_HINT,
    [ErrorCategory.SERVER]: ErrorTranslationKeys.DEFAULT_HINT,
    [ErrorCategory.DATABASE]: ErrorTranslationKeys.DEFAULT_HINT,
    [ErrorCategory.UNKNOWN]: ErrorTranslationKeys.DEFAULT_HINT,
  };

  return hints[error.category] || ErrorTranslationKeys.DEFAULT_HINT;
}
