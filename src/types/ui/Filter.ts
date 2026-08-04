export type FilterType = "search" | "select" | "multi-select" | "date-range";

export interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface FilterField {
  key: string;
  type: FilterType;
  label: string;
  placeholder?: string;
  options?: FilterOption[];
}

export type FilterValues = Record<string, string | undefined>;
