import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/components/shared/toast";
import { isRateLimitError } from "@/lib/api/client";

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
      refetchOnWindowFocus: true, // Refetch on focus, but only when data is stale
      refetchOnReconnect: true, // Refresh data when the connection comes back
      refetchOnMount: true, // Refetch on mount only when the cached data is stale
      networkMode: "offlineFirst", // Serve cached data instantly when offline
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
      networkMode: "offlineFirst", // Let offline mutations queue locally instead of pausing
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
