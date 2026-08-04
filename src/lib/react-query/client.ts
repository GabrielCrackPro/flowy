import { QueryClient } from "@tanstack/react-query";
import { isRateLimitError } from "@/lib/api/client";
import { toast } from "@/components/shared/toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Consider data fresh for 30 seconds
      retry: (failureCount, error) => {
        // Don't retry rate limit errors - the API client handles retries
        if (isRateLimitError(error)) {
          return false;
        }
        // Retry up to 1 time for other errors
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary reloads
      refetchOnReconnect: false, // Don't refetch on reconnect unless needed
      refetchOnMount: true, // Refetch on mount only when the cached data is stale
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry rate limit errors - the API client handles retries
        if (isRateLimitError(error)) {
          return false;
        }
        // Retry up to 1 time for other errors
        return failureCount < 1;
      },
      onError: (error) => {
        // Show rate limit toast for 429 errors
        if (isRateLimitError(error)) {
          toast.rateLimit("Too many requests", error.retryAfter, {
            duration: (error.retryAfter ?? 5) * 1000 + 2000,
          });
        }
      },
    },
  },
});
