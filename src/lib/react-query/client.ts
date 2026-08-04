import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Consider data fresh for 30 seconds
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary reloads
      refetchOnReconnect: false, // Don't refetch on reconnect unless needed
      refetchOnMount: true, // Refetch on mount only when the cached data is stale
    },
    mutations: {
      retry: 1,
    },
  },
});
