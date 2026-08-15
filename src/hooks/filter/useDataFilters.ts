"use client";

import { useEffect, useState } from "react";
import type { FilterField } from "@/types/ui";
import { useDebounce } from "../useDebounce";

interface UseDataFiltersParams {
  fields: FilterField[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useDataFilters({
  fields,
  values,
  onChange,
  open: externalOpen,
  onOpenChange,
}: UseDataFiltersParams) {
  const [internalOpen, setInternalOpen] = useState(false);
  const filtersOpen = externalOpen ?? internalOpen;
  const setFiltersOpen = onOpenChange ?? setInternalOpen;

  const searchField = fields.find((field) => field.type === "search");

  const [searchDraft, setSearchDraft] = useState(() =>
    searchField ? (values[searchField.key] ?? "") : "",
  );

  const debouncedSearch = useDebounce(searchDraft, 300);

  useEffect(() => {
    if (!searchField) {
      return;
    }

    const parentValue = values[searchField.key] ?? "";

    if (parentValue !== searchDraft) {
      setSearchDraft(parentValue);
    }
  }, [values, searchField, searchDraft]);

  useEffect(() => {
    if (!searchField) {
      return;
    }

    const currentValue = values[searchField.key] ?? "";

    if (debouncedSearch !== currentValue) {
      onChange(searchField.key, debouncedSearch || undefined);
    }
  }, [debouncedSearch, searchField, values, onChange]);

  const filterFields = fields.filter((field) => field.type !== "search");
  const activeFiltersCount = filterFields.reduce((count, field) => {
    if (field.type === "date-range") {
      return (
        count + (values[`${field.key}From`] || values[`${field.key}To`] ? 1 : 0)
      );
    }

    return count + (values[field.key] ? 1 : 0);
  }, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const searchPlaceholder =
    searchField?.placeholder ?? searchField?.label ?? "Buscar";

  return {
    filtersOpen,
    setFiltersOpen,
    searchField,
    searchDraft,
    setSearchDraft,
    searchPlaceholder,
    filterFields,
    activeFiltersCount,
    hasActiveFilters,
  };
}
