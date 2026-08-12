import { z } from "zod";

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const paymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "BIZUM",
  "PAYPAL",
  "OTHER",
]);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive("validation.amountPositive"),
  description: z.string().trim().max(255).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  paymentMethod: paymentMethodSchema.optional(),
  date: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
  receiptUrl: z.string().url().nullable().optional(),
  isRecurring: z.boolean().optional(),
  budgetId: z.string().uuid().nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionSchema = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>;
