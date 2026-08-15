import type { Category } from "./Category";
import type { ProfileIdentity } from "./ProfileIdentity";

export type TransactionType = "INCOME" | "EXPENSE";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "BIZUM"
  | "PAYPAL"
  | "OTHER";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  tags?: Category[];
  paymentMethod: PaymentMethod | null;
  date: string | null;
  notes: string | null;
  receiptUrl: string | null;
  isRecurring: boolean;
  budgetId?: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  user?: ProfileIdentity | null;
  updatedByProfile?: ProfileIdentity | null;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  description?: string | null;
  categoryIds?: string[];
  paymentMethod?: PaymentMethod | null;
  date?: Date | null;
  notes?: string | null;
  receiptUrl?: string | null;
  isRecurring?: boolean;
  budgetId?: string | null;
}

export interface UpdateTransactionInput
  extends Partial<CreateTransactionInput> {}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  paymentMethod?: PaymentMethod | PaymentMethod[];
  from?: string;
  to?: string;
  isRecurring?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TransactionList {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
