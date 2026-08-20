import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  windowStart: number;
}

interface RateLimitConfig {
  requests: number;
  window: number; // in milliseconds
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

// Helper to get environment variable with fallback
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return defaultValue;
}

// Check if rate limiting is enabled (enabled by default)
export const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== "false";

// Default rate limit configurations (can be overridden by environment variables)
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Stricter limits for write operations
  transaction: {
    requests: getEnvNumber("RATE_LIMIT_TRANSACTION_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_TRANSACTION_WINDOW", 120 * 1000),
  },
  budget: {
    requests: getEnvNumber("RATE_LIMIT_BUDGET_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_BUDGET_WINDOW", 120 * 1000),
  },
  goal: {
    requests: getEnvNumber("RATE_LIMIT_GOAL_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_GOAL_WINDOW", 120 * 1000),
  },
  category: {
    requests: getEnvNumber("RATE_LIMIT_CATEGORY_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_CATEGORY_WINDOW", 120 * 1000),
  },
  subscription: {
    requests: getEnvNumber("RATE_LIMIT_SUBSCRIPTION_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_SUBSCRIPTION_WINDOW", 120 * 1000),
  },
  comment: {
    requests: getEnvNumber("RATE_LIMIT_COMMENT_REQUESTS", 30),
    window: getEnvNumber("RATE_LIMIT_COMMENT_WINDOW", 120 * 1000),
  },

  // Moderate limits for read operations
  dashboard: {
    requests: getEnvNumber("RATE_LIMIT_DASHBOARD_REQUESTS", 30),
    window: getEnvNumber("RATE_LIMIT_DASHBOARD_WINDOW", 120 * 1000),
  },
  search: {
    requests: getEnvNumber("RATE_LIMIT_SEARCH_REQUESTS", 40),
    window: getEnvNumber("RATE_LIMIT_SEARCH_WINDOW", 120 * 1000),
  },
  stats: {
    requests: getEnvNumber("RATE_LIMIT_STATS_REQUESTS", 50),
    window: getEnvNumber("RATE_LIMIT_STATS_WINDOW", 120 * 1000),
  },

  // Permissive limits for profile/account operations
  profile: {
    requests: getEnvNumber("RATE_LIMIT_PROFILE_REQUESTS", 30),
    window: getEnvNumber("RATE_LIMIT_PROFILE_WINDOW", 120 * 1000),
  },
  account: {
    requests: getEnvNumber("RATE_LIMIT_ACCOUNT_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_ACCOUNT_WINDOW", 120 * 1000),
  },
  "push-preferences": {
    requests: getEnvNumber("RATE_LIMIT_PUSH_PREFERENCES_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_PUSH_PREFERENCES_WINDOW", 120 * 1000),
  },
  pushSubscription: {
    requests: getEnvNumber("RATE_LIMIT_PUSH_SUBSCRIPTION_REQUESTS", 30),
    window: getEnvNumber("RATE_LIMIT_PUSH_SUBSCRIPTION_WINDOW", 120 * 1000),
  },

  // Space management — create/join/rename/delete are sensitive writes
  space: {
    requests: getEnvNumber("RATE_LIMIT_SPACE_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_SPACE_WINDOW", 120 * 1000),
  },

  // File uploads are heavier payloads — stricter than plain writes
  upload: {
    requests: getEnvNumber("RATE_LIMIT_UPLOAD_REQUESTS", 10),
    window: getEnvNumber("RATE_LIMIT_UPLOAD_WINDOW", 120 * 1000),
  },

  // Public status page — polled by browsers, so a generous per-IP window
  status: {
    requests: getEnvNumber("RATE_LIMIT_STATUS_REQUESTS", 30),
    window: getEnvNumber("RATE_LIMIT_STATUS_WINDOW", 120 * 1000),
  },

  // Lightweight status summary — the header dot polls it every minute
  statusSummary: {
    requests: getEnvNumber("RATE_LIMIT_STATUS_SUMMARY_REQUESTS", 120),
    window: getEnvNumber("RATE_LIMIT_STATUS_SUMMARY_WINDOW", 120 * 1000),
  },

  // Incident management writes
  statusIncident: {
    requests: getEnvNumber("RATE_LIMIT_STATUS_INCIDENT_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_STATUS_INCIDENT_WINDOW", 120 * 1000),
  },

  // Admin-only operations (e.g. promoting a user to admin)
  adminPromote: {
    requests: getEnvNumber("RATE_LIMIT_ADMIN_PROMOTE_REQUESTS", 10),
    window: getEnvNumber("RATE_LIMIT_ADMIN_PROMOTE_WINDOW", 120 * 1000),
  },

  // First-admin bootstrap — secret-gated, very strict (brute-force guard)
  adminBootstrap: {
    requests: getEnvNumber("RATE_LIMIT_ADMIN_BOOTSTRAP_REQUESTS", 5),
    window: getEnvNumber("RATE_LIMIT_ADMIN_BOOTSTRAP_WINDOW", 120 * 1000),
  },

  // Demoting an admin — sensitive, strict
  adminDemote: {
    requests: getEnvNumber("RATE_LIMIT_ADMIN_DEMOTE_REQUESTS", 10),
    window: getEnvNumber("RATE_LIMIT_ADMIN_DEMOTE_WINDOW", 120 * 1000),
  },

  // Per-component check history (detail view)
  statusComponent: {
    requests: getEnvNumber("RATE_LIMIT_STATUS_COMPONENT_REQUESTS", 60),
    window: getEnvNumber("RATE_LIMIT_STATUS_COMPONENT_WINDOW", 120 * 1000),
  },

  // Status alert preferences
  statusPreferences: {
    requests: getEnvNumber("RATE_LIMIT_STATUS_PREFERENCES_REQUESTS", 20),
    window: getEnvNumber("RATE_LIMIT_STATUS_PREFERENCES_WINDOW", 120 * 1000),
  },

  // Push delivery history — read-only per-user notification audit
  pushDeliveryHistory: {
    requests: getEnvNumber("RATE_LIMIT_PUSH_DELIVERY_HISTORY_REQUESTS", 60),
    window: getEnvNumber("RATE_LIMIT_PUSH_DELIVERY_HISTORY_WINDOW", 120 * 1000),
  },

  // Default limit for unconfigured routes
  default: {
    requests: getEnvNumber("RATE_LIMIT_DEFAULT_REQUESTS", 150),
    window: getEnvNumber("RATE_LIMIT_DEFAULT_WINDOW", 120 * 1000),
  },
};

export function getRateLimitConfig(routeName: string): RateLimitConfig {
  return DEFAULT_RATE_LIMITS[routeName] || DEFAULT_RATE_LIMITS.default;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry exists or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.window,
      windowStart: now,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      success: true,
      remaining: config.requests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if within the current window
  if (entry.count >= config.requests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get current rate limit status without incrementing counter
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig,
): { remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      remaining: config.requests,
      resetTime: now + config.window,
    };
  }

  return {
    remaining: Math.max(0, config.requests - entry.count),
    resetTime: entry.resetTime,
  };
}

export function createRateLimitResponse(
  remaining: number,
  resetTime: number,
): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  const response = NextResponse.json(
    {
      message: "Too many requests. Please try again later.",
      retryAfter,
      retryAt: new Date(resetTime).toISOString(),
      category: "rate_limit",
      isRetryable: true,
    },
    { status: 429 },
  );

  response.headers.set("X-RateLimit-Limit", "100");
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(resetTime).toISOString());
  response.headers.set("Retry-After", retryAfter.toString());

  return response;
}

export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number,
  limit: number,
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(resetTime).toISOString());

  return response;
}
