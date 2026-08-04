import { serializeDateOnly } from "@/lib/date-only";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  UpdateTransactionInput,
} from "@/types/Transaction";
import { createApi } from "./factory";

export const transactionApi = createApi<Transaction, TransactionFilters>(
  "/api/transaction",
);

export const getTransactions = async (filters?: TransactionFilters) => {
  const result = await transactionApi.list(filters);
  // Handle both old array format and new paginated format
  return Array.isArray(result) ? result : result;
};

export const getTransaction = transactionApi.get;
export const createTransaction = (data: CreateTransactionInput) =>
  transactionApi.create({
    ...data,
    date: serializeDateOnly(data.date),
  });
export const updateTransaction = (id: string, data: UpdateTransactionInput) =>
  transactionApi.update(id, {
    ...data,
    date: serializeDateOnly(data.date),
  });
export const deleteTransaction = transactionApi.delete;

// Add bulk delete function
export const bulkDeleteTransactions = async (ids: string[]) => {
  const response = await fetch("/api/transaction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "bulkDelete",
      ids,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete transactions");
  }

  return response.json();
};
