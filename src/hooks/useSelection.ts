"use client";

import { useCallback, useState } from "react";

export function useSelection<T extends string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const handleSelect = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((items: T[]) => {
    setSelectedIds((prev) => {
      if (prev.size === items.length && items.length > 0) return new Set();
      return new Set(items);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = (items: T[]) =>
    items.length > 0 && items.every((item) => selectedIds.has(item));

  const isSomeSelected = selectedIds.size > 0;

  return {
    selectedIds,
    setSelectedIds,
    handleSelect,
    handleSelectAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  };
}
