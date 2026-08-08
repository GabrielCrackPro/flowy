"use client";

import { useEntityApi } from "@/hooks/useEntityApi";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "@/lib/api/transaction";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionList,
  UpdateTransactionInput,
} from "@/types/Transaction";

export function useTransactionApi(filters?: TransactionFilters) {
  const { data, ...rest } = useEntityApi<
    Transaction,
    TransactionFilters,
    CreateTransactionInput,
    UpdateTransactionInput
  >({
    queryKey: "transactions",
    listApi: getTransactions,
    createApi: createTransaction,
    updateApi: updateTransaction,
    deleteApi: deleteTransaction,
    entityName: "common.transaction",
    filters,
  });

  // Handle the new paginated response structure
  const transactions = Array.isArray(data)
    ? data
    : ((data as TransactionList)?.data ?? []);
  const pagination = !Array.isArray(data)
    ? {
        total: (data as TransactionList)?.total ?? 0,
        page: (data as TransactionList)?.page ?? 1,
        limit: (data as TransactionList)?.limit ?? 50,
        totalPages: (data as TransactionList)?.totalPages ?? 1,
      }
    : undefined;

  return { transactions, pagination, ...rest };
}
