"use client";

import { useCallback, useEffect, useState } from "react";

export function useFilterState<T extends Record<string, string | undefined>>(
  initialState: T = {} as T,
) {
  const [filters, setFilters] = useState<T>(initialState);
  const [debouncedFilters, setDebouncedFilters] = useState<T>(initialState);
  const [filterOpen, setFilterOpen] = useState(false);

  // Debounce filter changes to avoid excessive refetches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    // Clear every key rather than restoring initialState, so "clear"
    // semantics hold even when initialState carries URL-derived values.
    setFilters(
      (prev) =>
        Object.fromEntries(
          Object.keys(prev).map((key) => [key, undefined]),
        ) as T,
    );
  }, []);

  const hasFilters = Object.entries(filters).some(
    ([, v]) => v !== undefined && v !== "",
  );

  return {
    filters,
    debouncedFilters,
    filterOpen,
    setFilterOpen,
    handleFilterChange,
    handleClearFilters,
    hasFilters,
  };
}
