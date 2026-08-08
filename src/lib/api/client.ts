import { RateLimitError as AppRateLimitError } from "@/lib/errors/error-types";
import supabase from "@/lib/supabase/client";

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export interface RateLimitError extends Error {
  retryAfter?: number;
  isRateLimit: true;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  // Check for both the client interface and the AppError class
  if (error instanceof AppRateLimitError) {
    return true;
  }
  return (
    error instanceof Error &&
    "isRateLimit" in error &&
    (error as RateLimitError).isRateLimit === true
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function authenticatedRequest<T>(
  url: string,
  init?: RequestInit & { retryCount?: number },
): Promise<T> {
  const maxRetries = 3; // Number of retry attempts before showing rate limit error
  const retryCount = init?.retryCount ?? 0;
  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    // Handle 429 Rate Limit errors
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 5; // Default to 5 seconds if not provided

      // Also check if body has retryAfter
      const bodyRetryAfter = body?.retryAfter as number | undefined;
      const finalRetryAfter = bodyRetryAfter ?? retryAfterSeconds;

      if (retryCount < maxRetries) {
        // Wait for the retry-after time plus some jitter
        const waitTime = finalRetryAfter * 1000 + Math.random() * 1000;
        await sleep(waitTime);

        // Retry the request with incremented retry count
        return authenticatedRequest<T>(url, {
          ...init,
          retryCount: retryCount + 1,
        });
      }

      // If we've exhausted retries, throw a rate limit error
      const error = new Error(
        body?.message ?? "Too many requests. Please try again later.",
      ) as RateLimitError;
      error.retryAfter = finalRetryAfter;
      error.isRateLimit = true;
      throw error;
    }

    // Handle other errors
    throw new Error(body?.message ?? "Ha ocurrido un error");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
