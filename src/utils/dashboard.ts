import type { StatsCardProps } from "@components/shared";
import { formatCurrency } from "@lib/utils";
import { parseDateOnly } from "@/lib/date-only";
import {
  Landmark,
  PiggyBank,
  Repeat2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "@/lib/icons";
import type { DashboardData } from "@/types/Dashboard";
import type { Goal } from "@/types/Goal";
import type { Subscription } from "@/types/Subscription";
import { computeNextBillingDate } from "@/utils/subscriptions";

export function getMonthName(month?: number, year?: number, locale = "es-ES") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(
    new Date(
      year ?? new Date().getFullYear(),
      (month ?? new Date().getMonth() + 1) - 1,
    ),
  );
}

interface DashboardStats {
  balance: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  savingsRate: number;
  activeSubscriptions: number;
  activeBudgets: number;
  prevIncome: number;
  prevExpenses: number;
  prevSavingsRate: number;
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  const rounded = roundTo1(((current - previous) / Math.abs(previous)) * 100);
  return rounded === 0 ? null : rounded;
}

export function buildDashboardCards(
  data: DashboardStats | null,
  month: number,
  year: number,
  locale: string,
  t: (key: string) => string,
): StatsCardProps[] {
  if (!data) return [];

  const incomeTrend = pctChange(data.incomeThisMonth, data.prevIncome);
  const expenseTrend = pctChange(data.expensesThisMonth, data.prevExpenses);
  const prevHadActivity = data.prevIncome > 0 || data.prevExpenses > 0;
  const savingsTrend = prevHadActivity
    ? roundTo1(data.savingsRate - data.prevSavingsRate)
    : null;

  return [
    {
      title: t("stats.totalBalance"),
      value: data.balance,
      variant: "currency",
      icon: Landmark,
      href: "/dashboard/transactions",
      description:
        data.balance >= 0
          ? t("stats.incomePositive")
          : t("stats.incomeNegative"),
    },
    {
      title: t("stats.incomeMonth"),
      value: data.incomeThisMonth,
      variant: "currency",
      icon: TrendingUp,
      href: "/dashboard/transactions",
      tone: "positive",
      description: getMonthName(month, year, locale),
      trend:
        incomeTrend === null
          ? undefined
          : { value: incomeTrend, label: t("stats.vsPrevMonth") },
    },
    {
      title: t("stats.expensesMonth"),
      value: data.expensesThisMonth,
      variant: "currency",
      icon: TrendingDown,
      href: "/dashboard/transactions",
      tone: "negative",
      description: getMonthName(month, year, locale),
      trend:
        expenseTrend === null
          ? undefined
          : {
              value: expenseTrend,
              invert: true,
              label: t("stats.vsPrevMonth"),
            },
    },
    {
      title: t("stats.savingsRate"),
      value: data.savingsRate,
      variant: "percentage",
      icon: PiggyBank,
      tone:
        data.savingsRate >= 20
          ? "positive"
          : data.savingsRate >= 0
            ? "default"
            : "negative",
      description:
        data.savingsRate >= 20
          ? t("stats.savingsExcellent")
          : t("stats.savingsTry"),
      trend:
        savingsTrend === null || savingsTrend === 0
          ? undefined
          : { value: savingsTrend, label: t("stats.vsPrevMonth") },
    },
    {
      title: t("stats.activeSubscriptions"),
      value: data.activeSubscriptions,
      variant: "count",
      icon: Repeat2,
      href: "/dashboard/subscriptions",
      tone: "info",
      description:
        data.activeSubscriptions === 0
          ? t("stats.noPayments")
          : `${data.activeSubscriptions} ${t("stats.payments")}`,
    },
    {
      title: t("stats.activeBudgets"),
      value: data.activeBudgets,
      variant: "count",
      icon: Wallet,
      href: "/dashboard/budgets",
      tone: "info",
      description: getMonthName(month, year, locale),
    },
  ];
}

export function getGreetingMessage(locale?: string) {
  const hour = new Date().getHours();
  const isEs = locale?.startsWith("es") ?? true;

  if (hour < 12) return isEs ? "Buenos días" : "Good morning";
  if (hour < 20) return isEs ? "Buenas tardes" : "Good afternoon";
  return isEs ? "Buenas noches" : "Good evening";
}

export type DashboardAlertVariant = "info" | "success" | "warning" | "danger";

export type DashboardAlertType =
  | "overspending"
  | "budget-exceeded"
  | "budget-near"
  | "upcoming-payment"
  | "goal-deadline"
  | "goal-achieved"
  | "low-savings"
  | "no-budgets";

export interface DashboardAlert {
  id: string;
  type: DashboardAlertType;
  variant: DashboardAlertVariant;
  title: string;
  description?: string;
}

const MAX_ALERTS = 4;
const NEAR_LIMIT_THRESHOLD = 0.8;
const PAYMENT_SOON_DAYS = 7;
const PAYMENT_URGENT_DAYS = 3;
const GOAL_DEADLINE_DAYS = 14;

function daysUntil(dateValue: string | Date | null | undefined): number | null {
  if (!dateValue) return null;
  const date = parseDateOnly(dateValue) ?? new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function roundPct(value: number) {
  return Math.max(0, Math.round(value));
}

export function buildDashboardAlerts(
  data: DashboardData | null,
  locale: string,
  currency: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  /** Cap the number of returned alerts. The dashboard shows the top few;
   * the alert/push service passes Infinity so every active condition fires. */
  max = MAX_ALERTS,
): DashboardAlert[] {
  if (!data) return [];

  const alerts: DashboardAlert[] = [];
  const { stats, budgets, subscriptions, goals } = data;

  // Overspending — highest severity
  if (stats.expensesThisMonth > stats.incomeThisMonth) {
    const overspent = stats.expensesThisMonth - stats.incomeThisMonth;
    alerts.push({
      id: "overspending",
      type: "overspending",
      variant: "danger",
      title: t("alerts.overspendingTitle"),
      description: t("alerts.overspendingDesc", {
        amount: formatCurrency(overspent, locale, currency),
      }),
    });
  }

  // Budgets exceeded / near limit
  const exceeded = budgets
    .filter(
      (budget) => budget.budgetLimit > 0 && budget.spent > budget.budgetLimit,
    )
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 2);

  for (const budget of exceeded) {
    const category = budget.category?.name ?? "—";
    alerts.push({
      id: `budget-exceeded-${budget.id}`,
      type: "budget-exceeded",
      variant: "danger",
      title: t("alerts.budgetExceededTitle", { category }),
      description: t("alerts.budgetExceededDesc", {
        pct: roundPct((budget.spent / budget.budgetLimit) * 100),
        amount: formatCurrency(
          budget.spent - budget.budgetLimit,
          locale,
          currency,
        ),
      }),
    });
  }

  const nearLimit = budgets
    .filter(
      (budget) =>
        budget.budgetLimit > 0 &&
        !(budget.spent > budget.budgetLimit) &&
        budget.spent >= budget.budgetLimit * NEAR_LIMIT_THRESHOLD,
    )
    .sort((a, b) => b.spent / b.budgetLimit - a.spent / a.budgetLimit)
    .slice(0, 2);

  for (const budget of nearLimit) {
    const category = budget.category?.name ?? "—";
    alerts.push({
      id: `budget-near-${budget.id}`,
      type: "budget-near",
      variant: "warning",
      title: t("alerts.budgetNearLimitTitle", { category }),
      description: t("alerts.budgetNearLimitDesc", {
        pct: roundPct((budget.spent / budget.budgetLimit) * 100),
        amount: formatCurrency(
          budget.budgetLimit - budget.spent,
          locale,
          currency,
        ),
      }),
    });
  }

  // Upcoming subscription payments. The stored nextPayment may have passed
  // (nothing advances it over time), so compute the effective date by
  // advancing past cycles — otherwise active subscriptions never alert.
  const urgentSubscription = subscriptions
    .filter((sub) => sub.active && sub.nextPayment)
    .map((sub) => ({
      sub,
      days: daysUntil(
        computeNextBillingDate(sub.nextPayment, sub.billingCycle, sub.active),
      ),
    }))
    .filter(
      (entry): entry is { sub: Subscription; days: number } =>
        entry.days !== null &&
        entry.days >= 0 &&
        entry.days <= PAYMENT_SOON_DAYS,
    )
    .sort((a, b) => a.days - b.days)[0];

  if (urgentSubscription) {
    const { sub, days } = urgentSubscription;
    const merchant = sub.merchant ?? "—";
    alerts.push({
      id: `payment-${sub.id}`,
      type: "upcoming-payment",
      variant: days <= PAYMENT_URGENT_DAYS ? "warning" : "info",
      title: t("alerts.upcomingPaymentTitle", { merchant }),
      description: t("alerts.upcomingPaymentDesc", {
        amount: formatCurrency(sub.amount ?? 0, locale, currency),
        days,
      }),
    });
  }

  // Goals with approaching deadline
  const expiringGoal = goals
    .filter(
      (goal) =>
        Number(goal.savedAmount) < Number(goal.targetAmount) && goal.deadline,
    )
    .map((goal) => ({ goal, days: daysUntil(goal.deadline) }))
    .filter(
      (entry): entry is { goal: Goal; days: number } =>
        entry.days !== null &&
        entry.days >= 0 &&
        entry.days <= GOAL_DEADLINE_DAYS,
    )
    .sort((a, b) => a.days - b.days)[0];

  if (expiringGoal) {
    const { goal, days } = expiringGoal;
    alerts.push({
      id: `goal-deadline-${goal.id}`,
      type: "goal-deadline",
      variant: "warning",
      title: t("alerts.goalDeadlineTitle"),
      description: t("alerts.goalDeadlineDesc", {
        days,
        title: goal.title,
        amount: formatCurrency(
          Number(goal.targetAmount) - Number(goal.savedAmount),
          locale,
          currency,
        ),
      }),
    });
  }

  // Low savings rate
  if (
    stats.savingsRate >= 0 &&
    stats.savingsRate < 20 &&
    stats.incomeThisMonth > 0
  ) {
    alerts.push({
      id: "low-savings",
      type: "low-savings",
      variant: "warning",
      title: t("alerts.lowSavingsTitle"),
      description: t("alerts.lowSavingsDesc", {
        rate: roundPct(stats.savingsRate),
      }),
    });
  }

  // Achieved goals
  const achievedGoal = goals.find(
    (goal) =>
      Number(goal.targetAmount) > 0 &&
      Number(goal.savedAmount) >= Number(goal.targetAmount),
  );

  if (achievedGoal) {
    alerts.push({
      id: `goal-achieved-${achievedGoal.id}`,
      type: "goal-achieved",
      variant: "success",
      title: t("alerts.goalAchievedTitle"),
      description: t("alerts.goalAchievedDesc", {
        title: achievedGoal.title,
        saved: formatCurrency(
          Number(achievedGoal.savedAmount),
          locale,
          currency,
        ),
        target: formatCurrency(
          Number(achievedGoal.targetAmount),
          locale,
          currency,
        ),
      }),
    });
  }

  // No budgets configured
  if (budgets.length === 0) {
    alerts.push({
      id: "no-budgets",
      type: "no-budgets",
      variant: "info",
      title: t("alerts.noBudgetsTitle"),
      description: t("alerts.noBudgetsDesc"),
    });
  }

  const priority: Record<DashboardAlertVariant, number> = {
    danger: 0,
    warning: 1,
    success: 2,
    info: 3,
  };

  return alerts
    .sort((a, b) => priority[a.variant] - priority[b.variant])
    .slice(0, max);
}
