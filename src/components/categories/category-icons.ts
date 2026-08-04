import type { IconProps } from "@/components/shared";
import {
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Music,
  PiggyBank,
  Pill,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  TrendingUp,
  Utensils,
  Wifi,
  Zap,
} from "@/lib/icons";

export interface CategoryIconOption {
  key: string;
  icon: IconProps["icon"];
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: "shopping", icon: ShoppingCart },
  { key: "groceries", icon: Utensils },
  { key: "restaurant", icon: Coffee },
  { key: "transport", icon: Car },
  { key: "fuel", icon: Fuel },
  { key: "housing", icon: Home },
  { key: "utilities", icon: Zap },
  { key: "phone", icon: Smartphone },
  { key: "internet", icon: Wifi },
  { key: "clothing", icon: Shirt },
  { key: "health", icon: HeartPulse },
  { key: "pharmacy", icon: Pill },
  { key: "education", icon: GraduationCap },
  { key: "books", icon: BookOpen },
  { key: "entertainment", icon: Film },
  { key: "music", icon: Music },
  { key: "games", icon: Gamepad2 },
  { key: "sports", icon: Dumbbell },
  { key: "travel", icon: Plane },
  { key: "gifts", icon: Gift },
  { key: "salary", icon: Briefcase },
  { key: "freelance", icon: Laptop },
  { key: "investments", icon: TrendingUp },
  { key: "savings", icon: PiggyBank },
  { key: "cash", icon: Banknote },
  { key: "card", icon: CreditCard },
  { key: "other", icon: Tag },
];

export const CATEGORY_ICON_MAP: Record<string, IconProps["icon"]> =
  Object.fromEntries(
    CATEGORY_ICON_OPTIONS.map((option) => [option.key, option.icon]),
  );

export function resolveCategoryIcon(key?: string | null): IconProps["icon"] {
  if (key && key in CATEGORY_ICON_MAP) {
    return CATEGORY_ICON_MAP[key];
  }
  return Tag;
}
