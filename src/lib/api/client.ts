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

export type UploadProgressHandler = (percent: number) => void;

type AuthenticatedRequestInit = RequestInit & {
  retryCount?: number;
  onUploadProgress?: UploadProgressHandler;
};

async function requestWithUploadProgress<T>(
  url: string,
  init: RequestInit,
  headers: Record<string, string>,
  onUploadProgress: UploadProgressHandler,
  retryCount: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(init.method ?? "POST", url, true);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.onload = async () => {
      const body = xhr.responseText
        ? (() => {
            try {
              return JSON.parse(xhr.responseText) as {
                error?: string;
                message?: string;
                retryAfter?: number;
                url?: string;
              };
            } catch {
              return null;
            }
          })()
        : null;

      if (xhr.status === 429) {
        const headerRetryAfter = xhr.getResponseHeader("Retry-After");
        const retryAfterSeconds = headerRetryAfter
          ? parseInt(headerRetryAfter, 10)
          : 5;
        const finalRetryAfter = body?.retryAfter ?? retryAfterSeconds;

        if (retryCount < 3) {
          await sleep(finalRetryAfter * 1000 + Math.random() * 1000);
          try {
            resolve(
              await requestWithUploadProgress(
                url,
                init,
                headers,
                onUploadProgress,
                retryCount + 1,
              ),
            );
          } catch (error) {
            reject(error);
          }
          return;
        }

        const error = new Error(
          body?.message ?? "Too many requests. Please try again later.",
        ) as RateLimitError;
        error.retryAfter = finalRetryAfter;
        error.isRateLimit = true;
        reject(error);
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(body?.message ?? body?.error ?? "Ha ocurrido un error"),
        );
        return;
      }

      resolve((xhr.status === 204 ? undefined : body) as T);
    };

    xhr.send(init.body as FormData);
  });
}

export async function authenticatedRequest<T>(
  url: string,
  init?: AuthenticatedRequestInit,
): Promise<T> {
  const maxRetries = 3; // Number of retry attempts before showing rate limit error
  const { retryCount = 0, onUploadProgress, ...requestInit } = init ?? {};
  const accessToken = await getAccessToken();

  // Multipart uploads need the browser to set the Content-Type (it includes
  // the boundary); forcing application/json would break them.
  const isFormData = requestInit.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(requestInit.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (onUploadProgress && isFormData) {
    return requestWithUploadProgress(
      url,
      requestInit,
      headers,
      onUploadProgress,
      retryCount,
    );
  }

  const response = await fetch(url, {
    ...requestInit,
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
          ...requestInit,
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

    // Handle other errors. Upload routes return `{ error: "<code>" }` instead
    // of a message, so fall back to it to keep error codes flowing to callers.
    throw new Error(body?.message ?? body?.error ?? "Ha ocurrido un error");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
