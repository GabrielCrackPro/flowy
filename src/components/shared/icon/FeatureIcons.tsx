import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpDown,
  Repeat2,
  Tag,
  Target,
  Wallet,
} from "@/lib/icons";
import { Icon, type IconProps } from "./Icon";

/**
 * Feature-specific icon components
 * These provide a consistent way to use feature icons across the application
 */

// Raw Lucide icons for use in components that need LucideIcon type
export const TransactionIconRaw = ArrowUpDown;
export const CategoryIconRaw = Tag;
export const BudgetIconRaw = Wallet;
export const GoalIconRaw = Target;
export const SubscriptionIconRaw = Repeat2;
export const IncomeIconRaw = ArrowUpCircle;
export const ExpenseIconRaw = ArrowDownCircle;

// Styled Icon components for general use
export function TransactionIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={ArrowUpDown} {...props} />;
}
TransactionIcon.displayName = "TransactionIcon";

export function CategoryIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Tag} {...props} />;
}
CategoryIcon.displayName = "CategoryIcon";

export function BudgetIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Wallet} {...props} />;
}
BudgetIcon.displayName = "BudgetIcon";

export function GoalIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Target} {...props} />;
}
GoalIcon.displayName = "GoalIcon";

export function SubscriptionIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Repeat2} {...props} />;
}
SubscriptionIcon.displayName = "SubscriptionIcon";

export function IncomeIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={ArrowUpCircle} {...props} />;
}
IncomeIcon.displayName = "IncomeIcon";

export function ExpenseIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={ArrowDownCircle} {...props} />;
}
ExpenseIcon.displayName = "ExpenseIcon";
