"use client";

import type { FilterField } from "@/types/ui";
import { DateRangeFilter } from "./date-range-filter";
import { MultiSelectFilter } from "./multi-select-filter";
import { SingleSelectFilter } from "./single-select-filter";

interface FilterRendererProps {
  field: FilterField;
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  t: (key: string) => string;
}

export function FilterRenderer({
  field,
  values,
  onChange,
  t,
}: FilterRendererProps) {
  switch (field.type) {
    case "search":
      return null;

    case "date-range":
      return (
        <DateRangeFilter
          field={field}
          values={values}
          onChange={onChange}
          t={t}
        />
      );

    case "multi-select":
      return (
        <MultiSelectFilter field={field} values={values} onChange={onChange} />
      );

    case "select":
      return (
        <SingleSelectFilter
          field={field}
          value={values[field.key]}
          onChange={(value) => onChange(field.key, value)}
        />
      );

    default:
      return null;
  }
}
