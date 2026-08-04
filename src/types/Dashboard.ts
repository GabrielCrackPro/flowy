import type { Activity } from "./Activity";
import type { Budget } from "./Budget";
import type { Goal } from "./Goal";
import type { Subscription } from "./Subscription";
import type { Transaction } from "./Transaction";

export interface DailyStatsPoint {
  day: number;
  income: number;
  expenses: number;
  balance: number;
}

export const OTHER_CATEGORY_KEY = "__other__";

export interface ExpenseCategoryStat {
  name: string;
  amount: number;
}

export interface DashboardStats {
  balance: number;

  incomeThisMonth: number;

  expensesThisMonth: number;

  savingsRate: number;

  activeSubscriptions: number;

  activeBudgets: number;

  dailySeries: DailyStatsPoint[];

  expensesByCategory: ExpenseCategoryStat[];
}

export interface BudgetWithSpent
  extends Omit<Budget, "income" | "expenses" | "remaining"> {
  spent: number;
}

export interface DashboardData {
  stats: DashboardStats;

  recentTransactions: Transaction[];

  budgets: BudgetWithSpent[];

  goals: Goal[];

  subscriptions: Subscription[];

  activities: Activity[];
}
