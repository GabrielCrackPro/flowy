import { useMemo, useState } from "react";

interface UseMultiSelectFilterParams {
  fieldKey: string;
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
}

export function useMultiSelectFilter({
  fieldKey,
  values,
  onChange,
}: UseMultiSelectFilterParams) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const value = values[fieldKey];

    return value ? value.split(",") : [];
  }, [fieldKey, values]);

  const isActive = selected.length > 0;

  function toggle(optionValue: string) {
    const next = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];

    onChange(fieldKey, next.length ? next.join(",") : undefined);
  }

  function clear() {
    onChange(fieldKey, undefined);
  }

  return {
    open,
    setOpen,
    selected,
    isActive,
    toggle,
    clear,
  };
}
