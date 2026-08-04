import { useCallback, useState } from "react";

interface PaginationState {
  page: number;
  limit: number;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalPages?: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  totalPages,
}: UsePaginationOptions = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 })); // Reset to first page when limit changes
  }, []);

  const nextPage = useCallback(() => {
    setPagination((prev) => {
      const maxPage = totalPages ?? prev.page + 1;
      return {
        ...prev,
        page: Math.min(prev.page + 1, maxPage),
      };
    });
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(prev.page - 1, 1),
    }));
  }, []);

  const reset = useCallback(() => {
    setPagination({ page: initialPage, limit: initialLimit });
  }, [initialPage, initialLimit]);

  const hasNextPage = totalPages ? pagination.page < totalPages : true;
  const hasPreviousPage = pagination.page > 1;

  return {
    pagination,
    ...pagination,
    setPage,
    setLimit,
    nextPage,
    previousPage,
    reset,
    hasNextPage,
    hasPreviousPage,
  };
}
