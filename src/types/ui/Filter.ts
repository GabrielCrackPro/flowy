import type { IconProps } from "@/components/shared/icon";

export type FilterType = "search" | "select" | "multi-select" | "date-range";

export interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  iconComponent?: IconProps["icon"];
  color?: string;
  paymentMethod?: string;
}

export interface FilterField {
  key: string;
  type: FilterType;
  label: string;
  icon?: IconProps["icon"];
  placeholder?: string;
  options?: FilterOption[];
}

export type FilterValues = Record<string, string | undefined>;
